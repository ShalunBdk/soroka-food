import { useEffect } from 'react';

interface HeadProps {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article';
  keywords?: string;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
}

const Head: React.FC<HeadProps> = ({
  title,
  description,
  image,
  url,
  type = 'website',
  keywords,
  author,
  publishedTime,
  modifiedTime,
}) => {
  useEffect(() => {
    // Update document title
    document.title = title;

    // Helper function to update or create meta tag
    const updateMetaTag = (selector: string, attribute: string, content: string) => {
      let element = document.querySelector(selector);
      if (!element) {
        element = document.createElement('meta');
        const attrName = selector.includes('property') ? 'property' : 'name';
        const attrValue = selector.match(/["']([^"']+)["']/)?.[1];
        if (attrValue) {
          element.setAttribute(attrName, attrValue);
          document.head.appendChild(element);
        }
      }
      element.setAttribute(attribute, content);
    };

    // Helper function to update or create link tag
    const updateLinkTag = (rel: string, href: string) => {
      let element = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;
      if (!element) {
        element = document.createElement('link');
        element.rel = rel;
        document.head.appendChild(element);
      }
      element.href = href;
    };

    // Basic meta tags
    updateMetaTag('meta[name="description"]', 'content', description);

    if (keywords) {
      updateMetaTag('meta[name="keywords"]', 'content', keywords);
    }

    if (author) {
      updateMetaTag('meta[name="author"]', 'content', author);
    }

    // Open Graph tags
    updateMetaTag('meta[property="og:title"]', 'content', title);
    updateMetaTag('meta[property="og:description"]', 'content', description);
    updateMetaTag('meta[property="og:type"]', 'content', type);

    if (url) {
      updateMetaTag('meta[property="og:url"]', 'content', url);
      updateLinkTag('canonical', url);
    }

    if (image) {
      updateMetaTag('meta[property="og:image"]', 'content', image);
      updateMetaTag('meta[property="og:image:width"]', 'content', '1200');
      updateMetaTag('meta[property="og:image:height"]', 'content', '630');
    }

    // Article specific tags
    if (type === 'article') {
      if (publishedTime) {
        updateMetaTag('meta[property="article:published_time"]', 'content', publishedTime);
      }
      if (modifiedTime) {
        updateMetaTag('meta[property="article:modified_time"]', 'content', modifiedTime);
      }
      if (author) {
        updateMetaTag('meta[property="article:author"]', 'content', author);
      }
    }

    // Twitter Card tags
    updateMetaTag('meta[name="twitter:card"]', 'content', 'summary_large_image');
    updateMetaTag('meta[name="twitter:title"]', 'content', title);
    updateMetaTag('meta[name="twitter:description"]', 'content', description);

    if (image) {
      updateMetaTag('meta[name="twitter:image"]', 'content', image);
    }

    // Additional SEO tags
    updateMetaTag('meta[name="robots"]', 'content', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
    updateMetaTag('meta[name="googlebot"]', 'content', 'index, follow');

  }, [title, description, image, url, type, keywords, author, publishedTime, modifiedTime]);

  return null;
};

export default Head;
