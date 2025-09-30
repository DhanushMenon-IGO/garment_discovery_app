from ..agents.discovery import web_search_curator
from ..agents.fetcher import fetch_pages
from ..agents.parser import parse_items
from ..agents.vision import featurize_items
from ..agents.cluster import cluster_items
from ..services.brief import write_brief


def run_pipeline(seed: dict):
    # 1) discovery (web only for PoC)
    sources = None