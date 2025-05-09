class APIError extends Error {
  constructor(
    statusCode,
    message = "Something went wrong!",
    data = null,
    errors = []
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.data = data;
    this.errors = errors;
    this.success = false;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      statusCode: this.statusCode,
      message: this.message,
      data: this.data,
      errors: this.errors,
      success: this.success,
    };
  }
}
