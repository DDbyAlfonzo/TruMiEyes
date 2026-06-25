export type UploadResult = {
  path: string;
  filename: string;
};

type UploadErrorPayload = {
  error?: string;
  message?: string;
};

export function uploadFileWithProgress(
  file: File,
  onProgress: (progress: number) => void,
) {
  return new Promise<UploadResult>((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", file);

    const request = new XMLHttpRequest();
    request.open("POST", "/api/upload");

    request.upload.onprogress = (event) => {
      if (!event.lengthComputable) {
        onProgress(15);
        return;
      }
      onProgress(Math.min(95, Math.round((event.loaded / event.total) * 100)));
    };

    request.onload = () => {
      let payload: UploadResult | UploadErrorPayload = {};
      try {
        payload = JSON.parse(request.responseText || "{}");
      } catch {
        payload = {};
      }

      if (request.status >= 200 && request.status < 300) {
        onProgress(100);
        resolve(payload as UploadResult);
        return;
      }

      reject(new Error(
        ("error" in payload && payload.error) ||
          ("message" in payload && payload.message) ||
          "Upload failed. Check your storage configuration and try again.",
      ));
    };

    request.onerror = () => {
      reject(new Error("Upload failed. Check your connection and try again."));
    };

    request.onabort = () => {
      reject(new Error("Upload cancelled."));
    };

    onProgress(1);
    request.send(formData);
  });
}
