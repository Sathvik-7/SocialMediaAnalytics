# Automatic Job Scheduling Guide for ETL

This guide details the steps to properly set up, monitor, and configure the automatic execution of your `ETL.py` script. The script is configured to safely process incremental data and ensure that duplicate records are not inserted.

## Method 1: Built-in Python APScheduler (Easiest)
Your `ETL.py` script already contains a built-in schedule orchestrator using the `APScheduler` library.

**Steps to activate it:**
1. Open `ETL/ETL.py` in your text editor.
2. Scroll to the bottom of the script.
3. Remove the `#` character to uncomment the scheduler lines. Your final code block should look like this:

```python
if __name__ == "__main__":
    # Run the ETL explicitly for testing once if desired:
    # run_etl()
    
    # Scheduler (Hourly)
    from apscheduler.schedulers.blocking import BlockingScheduler
    scheduler = BlockingScheduler()
    scheduler.add_job(run_etl, 'interval', hours=1)
    scheduler.start()
```

4. Run `python ETL.py` inside a terminal. The terminal will now explicitly hang open to silently process the `Data/` folders every hour and capture logs to the `Logs/etl_social.log` directory.

## Method 2: Windows Task Scheduler (Recommended for background execution)
If you do not want to keep a terminal open, you can delegate the schedule to Windows Task Scheduler.

**Steps to activate it:**
1. **Keep the script as a one-time execution run.** Ensure `ETL.py` executes `run_etl()` directly and does *not* invoke `scheduler.start()`.
2. Open **Windows Task Scheduler** from your Start menu boundary.
3. Click **Create Basic Task** on the right side.
4. **Name**: "Social Media Analytics ETL Load"
5. **Trigger**: Select "Daily" or your preferred macro-start time. Note: Check the box to repeat every hour in the Advanced Settings later if you want exactly hourly load rates.
6. **Action**: Select *Start a program*.
7. **Program/script**: enter the path to your python executable, usually `C:\Users\chill\AppData\Local\Programs\Python\Python311\python.exe`
8. **Add arguments**: `"d:\Database Engineer\SocialMediaAnalytics\ETL\ETL.py"`
9. **Start in**: `"d:\Database Engineer\SocialMediaAnalytics\ETL"`
10. Click **Finish**. The ETL script will now incrementally run strictly hourly in the background on your Windows machine even if you close the terminal!

## Logs Maintenance
Whichever orchestration route you define, execution failures and duplicate insertions are logged at `Logs/etl_social.log`. Make sure to clear this out periodically.
