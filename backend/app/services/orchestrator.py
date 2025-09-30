from celery_worker import celery
from .pipeline import run_pipeline


@celery.task
def task_run_trend_job(seed: dict):
    return run_pipeline(seed)