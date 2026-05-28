export function createRequest({ method = "GET", body } = {}) {
  return {
    method,
    async *[Symbol.asyncIterator]() {
      if (body !== undefined) {
        yield typeof body === "string" ? body : JSON.stringify(body);
      }
    },
  };
}

export function createResponse() {
  return {
    body: "",
    ended: false,
    headers: null,
    statusCode: null,
    end(chunk = "") {
      this.body += chunk;
      this.ended = true;
    },
    writeHead(statusCode, headers) {
      this.statusCode = statusCode;
      this.headers = headers;
      return this;
    },
  };
}

export function parseJsonBody(response) {
  return response.body ? JSON.parse(response.body) : null;
}
