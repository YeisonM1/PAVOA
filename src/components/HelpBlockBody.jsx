import { Fragment } from 'react';
import { Link } from 'react-router-dom';

const renderInlineContactLink = (text) => {
  const parts = String(text || '').split('Contacto');
  if (parts.length === 1) return text;

  return parts.map((part, index) => (
    <Fragment key={`${part}-${index}`}>
      {part}
      {index < parts.length - 1 && (
        <Link to="/contacto" className="text-stone-900 border-b border-stone-900">
          Contacto
        </Link>
      )}
    </Fragment>
  ));
};

export default function HelpBlockBody({ body, className = '' }) {
  const paragraphs = String(body || '').split(/\n{2,}/).filter(Boolean);

  return (
    <div className={className}>
      {paragraphs.map((paragraph, index) => (
        <p key={`${paragraph}-${index}`} className={index > 0 ? 'mt-4' : ''}>
          {renderInlineContactLink(paragraph)}
        </p>
      ))}
    </div>
  );
}
