import { preparedAvatarFieldName } from "@/lib/party-avatar-upload";

export type AvatarUploadProgress =
  | { phase: "uploading"; percent: number | null }
  | { phase: "saving"; percent: null }
  | { phase: "success"; percent: 100 };

export type AvatarUploadResponse = {
  participant: {
    avatar: unknown;
  };
};

export function uploadPreparedAvatar(
  file: File,
  options: {
    signal: AbortSignal;
    onProgress: (progress: AvatarUploadProgress) => void;
  },
) {
  return new Promise<AvatarUploadResponse>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    let settled = false;

    formData.append(preparedAvatarFieldName, file);
    xhr.open("POST", "/api/party/participant/avatar");
    xhr.responseType = "json";
    xhr.withCredentials = true;
    xhr.setRequestHeader("accept", "application/json");

    function cleanup() {
      options.signal.removeEventListener("abort", abort);
    }

    function finishError(error: Error) {
      if (settled) {
        return;
      }
      settled = true;
      cleanup();
      reject(error);
    }

    function abort() {
      if (!settled) {
        xhr.abort();
      }
    }

    xhr.upload.onprogress = (event) => {
      if (settled) {
        return;
      }

      if (!event.lengthComputable || event.total <= 0) {
        options.onProgress({ phase: "uploading", percent: null });
        return;
      }

      const requestRatio = Math.min(1, event.loaded / event.total);
      if (requestRatio >= 1) {
        options.onProgress({ phase: "saving", percent: null });
      } else {
        options.onProgress({
          phase: "uploading",
          percent: 10 + Math.round(requestRatio * 70),
        });
      }
    };

    xhr.onreadystatechange = () => {
      if (!settled && xhr.readyState >= XMLHttpRequest.HEADERS_RECEIVED) {
        options.onProgress({ phase: "saving", percent: null });
      }
    };

    xhr.onload = () => {
      if (settled) {
        return;
      }

      let payload:
        | (Partial<AvatarUploadResponse> & { error?: { message?: string } })
        | null = null;
      try {
        payload =
          xhr.response && typeof xhr.response === "object"
            ? xhr.response
            : JSON.parse(xhr.responseText || "null");
      } catch {
        payload = null;
      }

      if (xhr.status < 200 || xhr.status >= 300) {
        finishError(
          new Error(
            payload?.error?.message ?? "We could not save that avatar yet.",
          ),
        );
        return;
      }

      settled = true;
      cleanup();
      options.onProgress({ phase: "success", percent: 100 });
      resolve(payload as AvatarUploadResponse);
    };
    xhr.onerror = () => finishError(new Error("avatar_upload_failed"));
    xhr.ontimeout = () => finishError(new Error("avatar_upload_failed"));
    xhr.onabort = () =>
      finishError(new DOMException("Avatar upload cancelled", "AbortError"));

    if (options.signal.aborted) {
      finishError(new DOMException("Avatar upload cancelled", "AbortError"));
      return;
    }

    options.signal.addEventListener("abort", abort, { once: true });
    options.onProgress({ phase: "uploading", percent: 10 });
    xhr.send(formData);
  });
}
