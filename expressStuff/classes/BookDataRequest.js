class BookDataRequest {
  constructor(lob, source, booking_id, postbook) {
    this.lob = lob;
    this.source = source;
    this.booking_id = booking_id;
    this.postbook = postbook;
  }
}

module.exports = BookDataRequest;
