class ResponseStatus {
  constructor(isPresent, status, remark, data) {
    this.isPresent = isPresent;
    this.status = status;
    this.remark = remark;
    this.data = data;
  }
}

module.exports = ResponseStatus;
