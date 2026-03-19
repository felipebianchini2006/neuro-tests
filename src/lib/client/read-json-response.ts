type JsonResponseLike<T> = {
  json(): Promise<T>;
};

export async function readJsonResponse<T>(
  response: JsonResponseLike<T>,
): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof SyntaxError) {
      return null;
    }

    throw error;
  }
}
