import { motion } from 'framer-motion';
import sanitizeHtml from 'sanitize-html';

interface NoticeContentProps {
  content: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
}

export function NoticeContent({ content }: NoticeContentProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
      className="px-6 pb-6 text-sm text-gray-800 leading-relaxed space-y-4"
    >
      <div
        dangerouslySetInnerHTML={{
          __html: sanitizeHtml(content, {
            allowedTags: ['i', 'u', 'b', 'strong', 'sub', 'sup', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'ul', 'li', 'ol'],
          }),
        }}
      />
    </motion.div>
  );
}
