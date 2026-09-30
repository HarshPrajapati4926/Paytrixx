// Express 5 already forwards rejected promises, but keeping an explicit wrapper
// makes the intent obvious and keeps handlers portable.
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export class HttpError extends Error {
  constructor(status, message, fields) {
    super(message);
    this.status = status;
    this.fields = fields; // optional { fieldName: "message" } for form validation
  }
}
