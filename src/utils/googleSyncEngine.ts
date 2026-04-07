'use client';

/**
 * Google Drive Sync Engine (v2.9.1)
 * PC와 스마트폰 간의 할일(JSON) 데이터를 구글 드라이브 appDataFolder를 통해 실시간 동기화합니다.
 */

declare global {
    interface Window {
        gapi: any;
        google: any;
    }
}

let tokenClient: any = null;
let accessToken: string | null = null;

// API 스크립트 로드 대기
const waitForScripts = () => {
    return new Promise<void>((resolve) => {
        const check = () => {
            if (window.gapi && window.google) {
                resolve();
            } else {
                setTimeout(check, 100);
            }
        };
        check();
    });
};

// 1. 구글 토큰 클라이언트 초기화
export const initGoogleAuth = async (clientId: string) => {
    await waitForScripts();

    if (!clientId) {
        throw new Error('Google Client ID가 필요합니다.');
    }

    return new Promise<void>((resolve) => {
        tokenClient = window.google.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: 'https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/drive.file',
            callback: (response: any) => {
                if (response.error) {
                    throw new Error('인증 실패: ' + response.error);
                }
                accessToken = response.access_token;
                resolve();
            },
        });
        resolve();
    });
};

// 2. 로그인 및 토큰 발급
export const requestAccessToken = () => {
    return new Promise<string>((resolve, reject) => {
        if (!tokenClient) {
            reject(new Error('Auth가 초기화되지 않았습니다.'));
            return;
        }

        // 콜백 재정의 (버튼 누를 때마다 토큰 수신)
        tokenClient.callback = (response: any) => {
            if (response.error) {
                reject(new Error('인증 에러: ' + response.error));
            } else {
                accessToken = response.access_token;
                resolve(accessToken as string);
            }
        };

        tokenClient.requestAccessToken({ prompt: 'consent' });
    });
};

// 3. 구글 드라이브 파일 찾기 (todos.json)
const findTodosFile = async (token: string) => {
    const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=name='todos.json' and parents in 'appDataFolder'&spaces=appDataFolder`,
        {
            headers: { Authorization: `Bearer ${token}` },
        }
    );
    const data = await response.json();
    return data.files && data.files.length > 0 ? data.files[0] : null;
};

// 4. 데이터 내보내기 (Save to Cloud)
export const uploadTodos = async (todos: any[]) => {
    if (!accessToken) await requestAccessToken();
    const token = accessToken as string;

    const fileMetadata = {
        name: 'todos.json',
        parents: ['appDataFolder'],
    };

    const existingFile = await findTodosFile(token);
    const method = existingFile ? 'PATCH' : 'POST';
    const url = existingFile 
        ? `https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=multipart`
        : `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`;

    const boundary = 'foo_bar_baz';
    const delimiter = `--${boundary}`;
    const closeDelimiter = `\r\n--${boundary}--`;

    // PATCH일 경우 parents 정보 제외 (이미 존재하므로 수정 불필요 및 오류 방지)
    const metadata = existingFile 
        ? { name: 'todos.json' } 
        : { name: 'todos.json', parents: ['appDataFolder'] };

    const multipartRequestBody =
        delimiter + '\r\n' +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) + '\r\n' +
        delimiter + '\r\n' +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify(todos) +
        closeDelimiter;

    const response = await fetch(url, {
        method,
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: multipartRequestBody,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`파일 업로드 실패 (${response.status}): ${errorData.error?.message || response.statusText}`);
    }
    return await response.json();
};

// 5. 데이터 가져오기 (Pull from Cloud)
export const downloadTodos = async () => {
    if (!accessToken) await requestAccessToken();
    const token = accessToken as string;

    const existingFile = await findTodosFile(token);
    if (!existingFile) {
        throw new Error('드라이브에 저장된 데이터가 없습니다.');
    }

    const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${existingFile.id}?alt=media`,
        {
            headers: { Authorization: `Bearer ${token}` },
        }
    );

    if (!response.ok) throw new Error('파일 다운로드 실패');
    return await response.json();
};
