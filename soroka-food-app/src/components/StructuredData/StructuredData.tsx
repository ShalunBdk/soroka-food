import { useEffect } from 'react';

interface StructuredDataProps {
  data: Record<string, any>;
}

/**
 * Component for adding JSON-LD structured data to the page
 * This helps search engines understand the content better
 */
const StructuredData: React.FC<StructuredDataProps> = ({ data }) => {
  useEffect(() => {
    // Create script element for JSON-LD
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(data);
    script.id = `structured-data-${Date.now()}`;

    // Append to head
    document.head.appendChild(script);

    // Cleanup on unmount
    return () => {
      const existingScript = document.getElementById(script.id);
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
  }, [data]);

  return null;
};

export default StructuredData;
