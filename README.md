# 📊 Social Media Analytics Data Pipeline
An end-to-end Extract, Transform, and Load (ETL) data pipeline designed to ingest structured social media payloads, transform analytical metrics, and load incremental datasets into a MongoDB Document Database. Paired with a robust suite of high-level aggregation queries to extract immediate business intelligence.

## 📑 Table of Contents
- [Architecture Overview](#-architecture-overview)
- [Project Directory](#-project-directory)
- [Prerequisites](#-prerequisites)
- [Getting Started](#-getting-started)
- [ETL Scheduling](#-etl-scheduling)
- [Analytics & Aggregations](#-analytics--aggregations)

## 🏗 Architecture Overview

The pipeline leverages Python to process raw event batches and dynamically sync data to a MongoDB instance (`SocialMediaDB`). 

1. **Extraction:** Parses `Users`, `Posts`, `Likes`, and `Comments` data from raw JSON.
2. **Transformation:** Converts string dates into universally accepted ISO `datetime` objects, filters out invalid or spam content, and pre-calculates high-level Engagement Scores locally.
3. **Load:** Executes incremental loads enforcing unique checks across all records to omit duplicate collisions safely, preserving data integrity in the active database.

## 📂 Project Directory

```text
├── Analytics/
│   └── AggregationQueries.js    # 15 high-end MongoDB Aggregation Pipelines
├── Data/                        # Raw JSON Batch Data Inputs
│   ├── Comments.json
│   ├── Likes.json
│   ├── Posts.json
│   └── Users.json
├── ETL/
│   └── ETL.py                   # The core ETL processor and scheduler
├── Logs/
│   └── etl_social.log           # Application logs (Errors, Duplicates, Successes)
├── Scheduler/
│   └── Scheduling_Guide.md      # Documentation for automation & cron jobs
└── README.md                    # Project Documentation
```

## ⚙️ Prerequisites

Ensure your system meets the following requirements before proceeding:
- **Python 3.11+**
- **MongoDB 4.0+** running locally on port `27017`
- Pip packages: `pymongo` (v3.13.0 or compatible) and `apscheduler`

## 🚀 Getting Started

1. **Install Dependencies**
   Navigate to the ETL directory and install the necessary Python packages:
   ```bash
   cd ETL
   pip install pymongo==3.13.0 apscheduler
   ```

2. **Execute Initial Data Load**
   Run the ETL process manually to initialize the MongoDB collections and load the seed data:
   ```bash
   python ETL.py
   ```
   *Any subsequent executions will be logged natively in `/Logs/etl_social.log` as incremental checks, successfully and safely discarding duplicate hashes.*

## 🕒 ETL Scheduling

The codebase includes out-of-the-box infrastructure to automate hourly or daily data extraction using `APScheduler`. 

For comprehensive instructions on adapting the script into a continuous background service (via Python or Windows Task Scheduler), please reference the dedicated [Scheduling Guide](Scheduler/Scheduling_Guide.md).

## 📈 Analytics & Aggregations

Once the database is populated, business intelligence can be extracted immediately. 
Navigate to `Analytics/AggregationQueries.js` for 15 production-ready pipelines including:

- **Virality Facets:** Benchmarking top-performing posts against global engagement averages.
- **DAU & Retention:** Extracting Daily Active Users via timestamp grouping.
- **Hashtag Co-occurrence:** Cross-referencing advanced tag matrices.
- **Comment-to-Like Ratios:** Conditional mathematical aggregations per post.

Load these directly into **MongoDB Compass** or execute them natively using `mongosh`.
