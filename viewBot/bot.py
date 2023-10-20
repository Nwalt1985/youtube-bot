import tkinter as tk
from tkinter import ttk
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from stem import Signal
from stem.control import Controller
import time
import random

USER_AGENTS = [
    # Desktop User-Agents
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15",
    # Mobile User-Agents
    "Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (iPad; CPU OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (Android 11; Mobile; rv:89.0) Gecko/89.0 Firefox/89.0",
    "Mozilla/5.0 (Linux; Android 10; SM-A205U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36",
    "Mozilla/5.0 (Linux; Android 9; SM-G950F Build/PPR1.180610.011; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/74.0.3729.157 Mobile Safari/537.36",
]


def renew_tor_ip():
    """Use stem to renew the Tor IP."""
    with Controller.from_port(port=9051) as controller:
        controller.authenticate()
        controller.signal(Signal.NEWNYM)
    time.sleep(float(tor_renew_delay_entry.get()))


def get_random_user_agent():
    """Return a random User-Agent from the list."""
    return random.choice(USER_AGENTS)


def start_bot():
    # Logic for starting the bot using Selenium
    channel_url = channel_url_entry.get()

    # Extract all video links
    chrome_options = webdriver.ChromeOptions()
    chrome_options.add_argument("--proxy-server=socks5://127.0.0.1:9050")
    browser = webdriver.Chrome(chrome_options=chrome_options)
    browser.get(channel_url)
    browser.implicitly_wait(int(implicit_wait_entry.get()))
    try:
        video_elements = WebDriverWait(browser, int(explicit_wait_entry.get())).until(
            EC.presence_of_all_elements_located((By.XPATH, "//a[@id='video-title']"))
        )
        video_links = [video.get_attribute("href") for video in video_elements]
    except Exception as e:
        print(f"Error: {e}")
        video_links = []
    browser.close()

    # Navigate to each link after renewing IP and changing User-Agent
    for link in video_links:
        max_views = random.randint(1, int(max_views_entry.get()))
        for _ in range(max_views):
            # Renew Tor IP
            renew_tor_ip()

            # Change User-Agent and navigate to video link
            chrome_options = webdriver.ChromeOptions()
            chrome_options.add_argument("--proxy-server=socks5://127.0.0.1:9050")
            chrome_options.add_argument(f"user-agent={get_random_user_agent()}")
            browser = webdriver.Chrome(chrome_options=chrome_options)
            browser.get(link)

            # Introduce a delay before moving to the next video
            time.sleep(float(video_nav_delay_entry.get()))
            browser.close()


app = tk.Tk()
app.title("YouTube Video Liker Bot")

frame = ttk.Frame(app, padding="10")
frame.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))

ttk.Label(frame, text="YouTube Channel URL:").grid(column=0, row=0, sticky=tk.W, pady=5)
channel_url_entry = ttk.Entry(frame, width=40)
channel_url_entry.grid(column=1, row=0, pady=5)

ttk.Label(frame, text="Implicit Wait (seconds):").grid(
    column=0, row=1, sticky=tk.W, pady=5
)
implicit_wait_entry = ttk.Entry(frame, width=10)
implicit_wait_entry.insert(0, "10")  # Default value
implicit_wait_entry.grid(column=1, row=1, pady=5)

ttk.Label(frame, text="Explicit Wait (seconds):").grid(
    column=0, row=2, sticky=tk.W, pady=5
)
explicit_wait_entry = ttk.Entry(frame, width=10)
explicit_wait_entry.insert(0, "20")  # Default value
explicit_wait_entry.grid(column=1, row=2, pady=5)

ttk.Label(frame, text="Tor Renew Delay (seconds):").grid(
    column=0, row=3, sticky=tk.W, pady=5
)
tor_renew_delay_entry = ttk.Entry(frame, width=10)
tor_renew_delay_entry.insert(0, "15")  # Default value
tor_renew_delay_entry.grid(column=1, row=3, pady=5)

ttk.Label(frame, text="Video Navigation Delay (seconds):").grid(
    column=0, row=4, sticky=tk.W, pady=5
)
video_nav_delay_entry = ttk.Entry(frame, width=10)
video_nav_delay_entry.insert(0, "15")  # Default value
video_nav_delay_entry.grid(column=1, row=4, pady=5)

ttk.Label(frame, text="Max Views Per Video:").grid(column=0, row=5, sticky=tk.W, pady=5)
max_views_entry = ttk.Entry(frame, width=10)
max_views_entry.insert(0, "20")  # Default value
max_views_entry.grid(column=1, row=5, pady=5)

start_button = ttk.Button(frame, text="Start Bot", command=start_bot)
start_button.grid(column=1, row=6, pady=20)

app.mainloop()
