FROM python:3.11-slim-bookworm

ENV GIT_SSH_COMMAND="ssh -o StrictHostKeyChecking=no"

RUN apt-get update \
    && apt-get install -y libgl1 libglib2.0-0 curl wget git procps \
    && apt-get clean

# For more details in the different torch distribution visit https://pytorch.org/.
RUN pip install --no-cache-dir docling torch torchvision torchaudio --index-url https://download.pytorch.org/whl/rocm6.2

ENV HF_HOME=/tmp/
ENV TORCH_HOME=/tmp/

COPY docs/examples/minimal.py /root/minimal.py

# On container environments, always set a thread budget to avoid undesired thread congestion.
ENV OMP_NUM_THREADS=4

# On container shell:
# > cd /root/
# > python minimal.py

WORKDIR /code

COPY ./requirements.txt /code/requirements.txt

RUN pip install --no-cache-dir -r /code/requirements.txt

COPY ./app /code/app

CMD ["fastapi", "run", "app/main.py", "--port", "80"]