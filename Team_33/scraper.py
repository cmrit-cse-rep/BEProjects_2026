import requests
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By
import time
import google.generativeai as genai
import os


def scrape_webpage(url, use_javascript=False, wait_time=10, headless=True):
    """
    Scrapes content from a webpage.
    
    Parameters:
    -----------
    url : str
        The URL of the webpage to scrape
    use_javascript : bool, optional
        If True, uses Selenium to render JavaScript-heavy pages (default: False)
        Set to True for pages that load content dynamically via JavaScript
    wait_time : int, optional
        Maximum time to wait for page elements to load in seconds (default: 10)
    headless : bool, optional
        If True, runs browser in headless mode (no visible window). Only used when use_javascript=True (default: True)
    
    Returns:
    --------
    str : The HTML content of the webpage
    None : If scraping fails
    
    Examples:
    ---------
    # Scrape a static webpage
    >>> content = scrape_webpage("https://example.com")
    >>> print(content[:100])
    
    # Scrape a JavaScript-rendered webpage
    >>> content = scrape_webpage("https://example.com", use_javascript=True, wait_time=15)
    >>> print(content[:100])
    """
    
    if not use_javascript:
        # Use requests for static HTML pages (faster and simpler)
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
            response = requests.get(url, headers=headers, timeout=10)
            response.raise_for_status()
            return response.text
        except requests.exceptions.RequestException as e:
            print(f"Error scraping webpage with requests: {e}")
            return None
    
    else:
        # Use Selenium for JavaScript-rendered pages
        try:
            chrome_options = Options()
            if headless:
                chrome_options.add_argument("--headless")
            chrome_options.add_argument("--no-sandbox")
            chrome_options.add_argument("--disable-dev-shm-usage")
            chrome_options.add_argument("--disable-blink-features=AutomationControlled")
            chrome_options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
            
            driver = webdriver.Chrome(options=chrome_options)
            driver.get(url)
            
            # Wait for page to load
            WebDriverWait(driver, wait_time).until(
                EC.presence_of_element_located((By.TAG_NAME, "body"))
            )
            
            # Additional wait to allow JavaScript to execute
            time.sleep(2)
            
            # Get page source
            page_content = driver.page_source
            driver.quit()
            
            return page_content
        
        except Exception as e:
            print(f"Error scraping webpage with Selenium: {e}")
            try:
                driver.quit()
            except:
                pass
            return None


def extract_text_from_html(html_content):
    """
    Extracts plain text from HTML content.
    
    Parameters:
    -----------
    html_content : str
        The HTML content to parse
    
    Returns:
    --------
    str : Plain text extracted from the HTML
    
    Example:
    --------
    >>> html = "<html><body><h1>Hello</h1><p>World</p></body></html>"
    >>> text = extract_text_from_html(html)
    >>> print(text)
    """
    if not html_content:
        return None
    
    try:
        soup = BeautifulSoup(html_content, 'html.parser')
        # Remove script and style elements
        for script in soup(["script", "style"]):
            script.decompose()
        text = soup.get_text(separator=' ', strip=True)
        return text
    except Exception as e:
        print(f"Error extracting text from HTML: {e}")
        return None


def extract_clean_content(html_content, article_tag=True, remove_extra_spans=True):
    """
    Extracts clean, readable content from HTML by removing redundant tags and formatting.
    Useful for pages with excessive nested HTML like privacy policies.
    
    Parameters:
    -----------
    html_content : str
        The HTML content to parse
    article_tag : bool, optional
        If True, tries to extract content from article or main content container first (default: True)
    remove_extra_spans : bool, optional
        If True, removes redundant nested span tags that don't add value (default: True)
    
    Returns:
    --------
    str : Clean, formatted text content
    None : If extraction fails
    
    Example:
    --------
    >>> html = "<html><body><article><span><span><p>Privacy Policy</p></span></span></article></body></html>"
    >>> content = extract_clean_content(html)
    >>> print(content)
    """
    if not html_content:
        return None
    
    try:
        soup = BeautifulSoup(html_content, 'html.parser')
        
        # Remove script, style, noscript, and meta elements
        for element in soup(["script", "style", "noscript", "meta", "link", "iframe"]):
            element.decompose()
        
        # Try to find main content area with better specificity
        content_area = None
        if article_tag:
            # Priority order for content detection:
            # 1. article tag
            # 2. main tag
            # 3. div with 'region-content' or 'main-content' class (more specific)
            # 4. div with 'content' class
            # 5. Find the largest div (likely the main content)
            content_area = soup.find('article')
            
            if not content_area:
                content_area = soup.find('main')
            
            if not content_area:
                # Look for more specific content containers
                content_area = soup.find('div', class_=lambda x: x and ('region-content' in (x if isinstance(x, str) else ' '.join(x))))
            
            if not content_area:
                content_area = soup.find('div', class_=lambda x: x and ('main-content' in (x if isinstance(x, str) else ' '.join(x))))
            
            if not content_area:
                # Fall back to generic content div but ensure it's large enough
                content_divs = soup.find_all('div', class_=lambda x: x and 'content' in (x if isinstance(x, str) else ' '.join(x)))
                if content_divs:
                    # Find the largest content div (most likely the actual content)
                    content_area = max(content_divs, key=lambda d: len(d.get_text()))
            
            if not content_area:
                # Find the largest div by text content (ultimate fallback for pages without semantic containers)
                all_divs = soup.find_all('div')
                if all_divs:
                    # Filter out tiny divs (likely navigation, ads, etc.) - only consider divs with significant content
                    significant_divs = [d for d in all_divs if len(d.get_text(strip=True)) > 500]
                    if significant_divs:
                        content_area = max(significant_divs, key=lambda d: len(d.get_text()))
        
        if not content_area:
            content_area = soup.find('body')
        
        if not content_area:
            content_area = soup
        
        # Remove navigation, header, footer elements
        for element in content_area.find_all(['nav', 'header', 'footer', 'aside'], recursive=True):
            element.decompose()
        
        if remove_extra_spans:
            # Remove redundant nested spans - keep only spans with meaningful attributes or content
            for span in content_area.find_all('span'):
                # If span has no class/id and only contains text or other spans, unwrap it
                if not span.get('class') and not span.get('id') and not span.get('style'):
                    span.unwrap()
        
        # Extract text with proper spacing
        text = content_area.get_text(separator='\n', strip=True)
        
        # Clean up excessive whitespace and empty lines
        lines = [line.strip() for line in text.split('\n') if line.strip()]
        cleaned_text = '\n'.join(lines)
        
        return cleaned_text
    
    except Exception as e:
        print(f"Error extracting clean content from HTML: {e}")
        return None


def scrape_and_extract(url, use_javascript=False, extract_text=True, wait_time=10):
    """
    Convenience function that scrapes a webpage and optionally extracts text.
    
    Parameters:
    -----------
    url : str
        The URL of the webpage to scrape
    use_javascript : bool, optional
        If True, renders JavaScript content (default: False)
    extract_text : bool, optional
        If True, extracts plain text from HTML (default: True)
    wait_time : int, optional
        Maximum time to wait for page elements to load (default: 10)
    
    Returns:
    --------
    str : Either HTML content or plain text depending on extract_text parameter
    None : If scraping fails
    
    Example:
    --------
    >>> content = scrape_and_extract("https://example.com", extract_text=True)
    >>> print(content)
    """
    html_content = scrape_webpage(url, use_javascript=use_javascript, wait_time=wait_time)
    
    if html_content is None:
        return None
    
    if extract_text:
        return extract_text_from_html(html_content)
    else:
        return html_content


def scrape_and_extract_clean(url, use_javascript=False, wait_time=10):
    """
    Scrapes a webpage and extracts clean, readable content (no HTML garbage).
    Perfect for privacy policies, terms of service, and other text-heavy pages.
    
    Parameters:
    -----------
    url : str
        The URL of the webpage to scrape
    use_javascript : bool, optional
        If True, renders JavaScript content (default: False)
    wait_time : int, optional
        Maximum time to wait for page elements to load (default: 10)
    
    Returns:
    --------
    str : Clean, formatted text content without HTML
    None : If scraping or extraction fails
    
    Example:
    --------
    >>> content = scrape_and_extract_clean("https://blinkit.com/privacy", use_javascript=True)
    >>> print(content)
    """
    html_content = scrape_webpage(url, use_javascript=use_javascript, wait_time=wait_time)
    
    if html_content is None:
        return None
    
    return extract_clean_content(html_content, article_tag=True, remove_extra_spans=True)


def extract_clean_content_from_file(html_file_path):
    """
    Extracts clean, readable content from an HTML file.
    Useful for processing previously saved HTML files or extracted content.
    
    Parameters:
    -----------
    html_file_path : str
        Path to the HTML file to extract content from
    
    Returns:
    --------
    str : Clean, formatted text content without HTML
    None : If extraction fails
    
    Example:
    --------
    >>> content = extract_clean_content_from_file("extracted_html.txt")
    >>> print(content)
    """
    try:
        with open(html_file_path, 'r', encoding='utf-8') as f:
            html_content = f.read()
        return extract_clean_content(html_content, article_tag=True, remove_extra_spans=True)
    except Exception as e:
        print(f"Error reading HTML file: {e}")
        return None
    
def extract_privacy_policy_url_from_play_store(html_content):
    """
    Extracts the actual privacy policy URL from Google Play Store Data Safety page.
    
    Parameters:
    -----------
    html_content : str
        The HTML content of the Play Store Data Safety page
    
    Returns:
    --------
    str : The privacy policy URL if found
    None : If no privacy policy link is found
    
    Example:
    --------
    >>> html = scrape_webpage('https://play.google.com/store/apps/datasafety?id=com.grofers.customerapp')
    >>> policy_url = extract_privacy_policy_url_from_play_store(html)
    >>> print(policy_url)
    """
    if not html_content:
        return None
    
    try:
        soup = BeautifulSoup(html_content, 'html.parser')
        
        # Find all <a> tags with class 'GO2pB'
        privacy_links = soup.find_all('a', class_='GO2pB')
        
        # Search through links for privacy/policy keywords
        for link in privacy_links:
            href = link.get('href')
            link_text = link.get_text().lower()
            
            if href and ('privacy' in href.lower() or 'privacy' in link_text or 'policy' in link_text):
                # If href doesn't start with http, prepend Play Store domain
                if href.startswith('http'):
                    return href
                else:
                    return f'https://play.google.com{href}'
        
        return None
    
    except Exception as e:
        print(f"Error extracting privacy policy URL from Play Store: {e}")
        return None

def scrape_play_store_privacy_policy(package_name, use_javascript=True, wait_time=15):
    """
    Scrapes a privacy policy from Google Play Store Data Safety page.
    
    This function:
    1. Builds the Play Store Data Safety URL from package name
    2. Scrapes the Play Store page
    3. Extracts the actual privacy policy link
    4. Scrapes and cleans the actual privacy policy content
    
    Parameters:
    -----------
    package_name : str
        The Android app package name (e.g., 'com.grofers.customerapp')
    use_javascript : bool, optional
        If True, renders JavaScript content (default: True)
    wait_time : int, optional
        Maximum time to wait for page elements to load (default: 15)
    
    Returns:
    --------
    dict : Dictionary with keys:
        - 'success': bool indicating if scraping was successful
        - 'content': Clean privacy policy content if successful
        - 'policy_url': The actual privacy policy URL found
        - 'error': Error message if not successful
    
    Example:
    --------
    >>> result = scrape_play_store_privacy_policy('com.grofers.customerapp')
    >>> if result['success']:
    ...     print(result['content'])
    ... else:
    ...     print(f"Error: {result['error']}")
    """
    try:
        # Step 1: Build Play Store URL
        play_store_url = f"https://play.google.com/store/apps/datasafety?id={package_name}&hl=en_US"
        print(f"[PLAY_STORE] Scraping Play Store page: {play_store_url}")
        
        # Step 2: Scrape Play Store page
        play_store_html = scrape_webpage(play_store_url, use_javascript=use_javascript, wait_time=wait_time)
        
        if not play_store_html:
            return {
                'success': False,
                'error': f'Failed to scrape Play Store page for package: {package_name}',
                'policy_url': None,
                'content': None
            }
        
        print(f"[PLAY_STORE] Play Store page scraped, extracting privacy policy link...")
        
        # Step 3: Extract actual privacy policy URL
        policy_url = extract_privacy_policy_url_from_play_store(play_store_html)
        
        if not policy_url:
            return {
                'success': False,
                'error': f'No privacy policy link found on Play Store page for package: {package_name}',
                'policy_url': None,
                'content': None
            }
        
        print(f"[PLAY_STORE] Found privacy policy URL: {policy_url}")
        
        # Step 4: Scrape actual privacy policy
        print(f"[PLAY_STORE] Scraping actual privacy policy from: {policy_url}")
        policy_content = scrape_and_extract_clean(policy_url, use_javascript=use_javascript, wait_time=wait_time)
        
        if not policy_content:
            return {
                'success': False,
                'error': f'Failed to scrape or extract privacy policy from: {policy_url}',
                'policy_url': policy_url,
                'content': None
            }
        
        print(f"[PLAY_STORE] Successfully scraped privacy policy ({len(policy_content)} characters)")
        
        return {
            'success': True,
            'error': None,
            'policy_url': policy_url,
            'content': policy_content
        }
    
    except Exception as e:
        print(f"[PLAY_STORE] Error during Play Store scraping: {str(e)}")
        return {
            'success': False,
            'error': f'Exception during Play Store scraping: {str(e)}',
            'policy_url': None,
            'content': None
        }        


def summarize_with_gemini(policy_text, api_key=None, model="gemini-2.5-flash"):
    """
    Summarizes policy text using Google's Gemini API.
    
    Parameters:
    -----------
    policy_text : str
        The policy text to summarize
    api_key : str, optional
        Google Gemini API key. If not provided, will look for GEMINI_API_KEY environment variable
    model : str, optional
        The Gemini model to use (default: "gemini-pro")
    
    Returns:
    --------
    str : The summarized policy text
    None : If summarization fails
    
    Example:
    --------
    >>> policy = "This privacy policy explains how we collect and use your data..."
    >>> summary = summarize_with_gemini(policy, api_key="your-api-key")
    >>> print(summary)
    
    Note:
    -----
    You can set the API key in two ways:
    1. Pass it directly: summarize_with_gemini(policy, api_key="your-key")
    2. Set environment variable: os.environ['GEMINI_API_KEY'] = 'your-key'
    """
    try:
        # Get API key from parameter or environment variable
        if api_key is None:
            api_key = os.environ.get('GEMINI_API_KEY')
        
        if not api_key:
            print("Error: Gemini API key not provided. Set GEMINI_API_KEY environment variable or pass api_key parameter.")
            return None
        
        # Configure the API
        genai.configure(api_key=api_key)
        
        # Initialize the model
        gemini_model = genai.GenerativeModel(model)
        
        # Create the prompt for summarization
        prompt = f"""Please provide a concise and comprehensive summary of the following privacy policy. 
The summary should cover:
1. What data is collected
2. How the data is used
3. Who the data is shared with
4. User rights and choices
5. Data security measures
6. Contact information for privacy concerns

Privacy Policy:
{policy_text}

Please provide a well-structured summary that is easy to understand."""
        
        # Generate the summary
        response = gemini_model.generate_content(prompt)
        
        if response and response.text:
            return response.text
        else:
            print("Error: Gemini API returned empty response")
            return None
    
    except Exception as e:
        print(f"Error summarizing with Gemini: {e}")
        return None


if __name__ == "__main__":
    # Example usage
    test_url = "https://blinkit.com/privacy"
    
    # Set your Gemini API key here or via environment variable
    # You can set it like this:
    # os.environ['GEMINI_API_KEY'] = 'your-api-key-here'
    # Or pass it directly to summarize_with_gemini()
    
    print("=" * 80)
    print("PRIVACY POLICY SCRAPER AND SUMMARIZER")
    print("=" * 80)
    
    print("\n1. Scraping JavaScript-rendered page...")
    content_js = scrape_webpage(test_url, use_javascript=True, wait_time=15)
    if content_js:
        print(f"   [OK] Scraped successfully ({len(content_js)} characters)")
    else:
        print("   [FAILED] Failed to scrape")
        exit(1)
    
    print("\n2. Extracting clean content...")
    clean_content = extract_clean_content(content_js)
    if clean_content:
        print(f"   [OK] Extracted successfully ({len(clean_content)} characters)")
        with open("privacy_policy_clean.txt", "w", encoding="utf-8") as f:
            f.write(clean_content)
        print("   [OK] Saved to privacy_policy_clean.txt")
    else:
        print("   [FAILED] Failed to extract")
        exit(1)
    
    print("\n3. Summarizing with Gemini...")
    # Get API key from environment variable or set it here
    api_key = os.environ.get('GEMINI_API_KEY')
    
    if not api_key:
        print("   [WARNING] GEMINI_API_KEY environment variable not set")
        print("   Set it with: os.environ['GEMINI_API_KEY'] = 'your-key'")
        print("   Or provide it directly to summarize_with_gemini()")
    else:
        summary = summarize_with_gemini(clean_content, api_key=api_key)
        if summary:
            print("   [OK] Summarization successful")
            with open("privacy_policy_summary.txt", "w", encoding="utf-8") as f:
                f.write(summary)
            print("   [OK] Saved to privacy_policy_summary.txt")
            print("\n" + "=" * 80)
            print("SUMMARY")
            print("=" * 80)
            print(summary)
        else:
            print("   [FAILED] Failed to summarize with Gemini")
    
    print("\n" + "=" * 80)

