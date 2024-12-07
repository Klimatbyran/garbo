from bullmq import Worker
import asyncio
import signal

async def process(job, job_token):
    # job.data will include the data added to the queue
    return doSomethingAsync(job)

async def main():
    # Create an event that will be triggered for shutdown
    shutdown_event = asyncio.Event()

    def signal_handler(signal, frame):
        print("Signal received, shutting down.")
        shutdown_event.set()

    # Assign signal handlers to SIGTERM and SIGINT
    signal.signal(signal.SIGTERM, signal_handler)
    signal.signal(signal.SIGINT, signal_handler)

    # Feel free to remove the connection parameter, if your redis runs on localhost
    worker = Worker("myQueue", process, {"connection": "rediss://<user>:<password>@<host>:<port>"})

    # Wait until the shutdown event is set
    await shutdown_event.wait()

    # close the worker
    print("Cleaning up worker...")
    await worker.close()
    print("Worker shut down successfully.")

if __name__ == "__main__":
    asyncio.run(main())