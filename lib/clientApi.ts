type ApiMessagePayload = {
  error?: string;
  message?: string;
  warning?: string;
};

export async function readApiMessage(response: Response, fallback: string) {
  try {
    const data = await response.clone().json() as ApiMessagePayload;
    if (typeof data.error === "string" && data.error.trim()) {
      return data.error;
    }
    if (typeof data.message === "string" && data.message.trim()) {
      return data.message;
    }
    if (typeof data.warning === "string" && data.warning.trim()) {
      return data.warning;
    }
  } catch {
    // Fall back to text if the response is not JSON.
  }

  try {
    const text = (await response.clone().text()).trim();
    if (text) {
      return text;
    }
  } catch {
    // Ignore text parsing errors and fall back to the provided message.
  }

  return fallback;
}

export async function readApiJson<T>(response: Response, fallback: string) {
  if (!response.ok) {
    throw new Error(await readApiMessage(response, fallback));
  }

  return response.json() as Promise<T>;
}
