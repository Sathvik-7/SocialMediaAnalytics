import os
import json
import pymongo
from datetime import datetime
import logging
from apscheduler.schedulers.blocking import BlockingScheduler

os.makedirs('../Logs', exist_ok=True)

# Logging
logging.basicConfig(
    filename='../Logs/etl_social.log',
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

client = pymongo.MongoClient("mongodb://localhost:27017/")
db = client["SocialMediaDB"]

def run_etl():
    try:
        # ---------- Extract ----------
        with open('../Data/Users.json') as f:
            users = json.load(f)
        with open('../Data/Posts.json') as f:
            posts = json.load(f)
        with open('../Data/Likes.json') as f:
            likes = json.load(f)
        with open('../Data/Comments.json') as f:
            comments = json.load(f)

        # ---------- Transform ----------
        # Remove spam posts (empty content)
        posts = [p for p in posts if p["Content"].strip() != ""]

        # Validate UserIDs
        valid_users = {u["UserID"] for u in users}
        posts = [p for p in posts if p["UserID"] in valid_users]

        # Engagement Calculation
        like_count = {}
        comment_count = {}

        for l in likes:
            like_count[l["PostID"]] = like_count.get(l["PostID"], 0) + 1

        for c in comments:
            comment_count[c["PostID"]] = comment_count.get(c["PostID"], 0) + 1

        for p in posts:
            pid = p["PostID"]
            p["EngagementScore"] = like_count.get(pid, 0) + comment_count.get(pid, 0)
            p["Timestamp"] = datetime.fromisoformat(p["Timestamp"])

        # Convert Dates
        for u in users:
            u["JoinDate"] = datetime.fromisoformat(u["JoinDate"])

        for l in likes:
            l["Timestamp"] = datetime.fromisoformat(l["Timestamp"])

        for c in comments:
            c["Timestamp"] = datetime.fromisoformat(c["Timestamp"])

        # ---------- Load ----------
        existing_collections = db.list_collection_names()
        for coll in ["Users", "Posts", "Likes", "Comments"]:
            if coll not in existing_collections:
                db.create_collection(coll)
                logging.info(f"Created collection: {coll}")

        def load_data(collection_name, data, unique_field):
            coll = db[collection_name]
            for item in data:
                query = {unique_field: item[unique_field]} if unique_field in item else {k: v for k, v in item.items() if k != "_id"}
                if coll.find_one(query):
                    msg = "data is already existed"
                    logging.error(f"{collection_name} - {msg}")
                    print(msg)
                else:
                    coll.insert_one(item)

        load_data("Users", users, "UserID")
        load_data("Posts", posts, "PostID")
        load_data("Likes", likes, "LikeID")
        load_data("Comments", comments, "CommentID")

        logging.info("ETL SUCCESS")

    except Exception as e:
        logging.error(f"ETL FAILED: {e}")

if __name__ == "__main__":
    # Run the ETL explicitly for testing
    run_etl()
    
    # Scheduler (Hourly)
    # scheduler = BlockingScheduler()
    # scheduler.add_job(run_etl, 'interval', hours=1)
    # scheduler.start()