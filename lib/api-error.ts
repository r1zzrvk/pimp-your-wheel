export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string) {
    super(code);
    this.status = status;
    this.code = code;
  }
}

export function errorResponse(error: unknown) {
  if (error instanceof ApiError) {
    return Response.json({ error: error.code }, { status: error.status });
  }
  console.error(error);
  return Response.json({ error: "INTERNAL" }, { status: 500 });
}
