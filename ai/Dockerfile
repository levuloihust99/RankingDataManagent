FROM python:3.9-slim-buster

WORKDIR /app

COPY requirements.txt requirements.txt

ENV PATH "/opt/venv/bin:${PATH}"

RUN python -m venv /opt/venv && \
    pip install -U pip && \
    pip install -r requirements.txt

COPY . .

CMD ["python", "-m", "apps.main"]
