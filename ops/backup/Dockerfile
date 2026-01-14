FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    sqlite3 ca-certificates \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /opt/boissons
COPY boissons-backup.sh /opt/boissons/boissons-backup.sh
COPY run.sh /opt/boissons/run.sh

# Ensure LF line endings + executable bits
RUN sed -i 's/\r$//' /opt/boissons/run.sh /opt/boissons/boissons-backup.sh \
 && chmod +x /opt/boissons/run.sh /opt/boissons/boissons-backup.sh

CMD ["/opt/boissons/run.sh"]