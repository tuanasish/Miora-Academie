import { Mark, mergeAttributes } from '@tiptap/core';

/**
 * TipTap Mark: Suggestion Insert
 *
 * Renders text that the teacher suggests adding.
 * Displayed as green underlined text with a suggestion ID data attribute.
 */
export const SuggestionInsertMark = Mark.create({
  name: 'suggestionInsert',

  addAttributes() {
    return {
      suggestionId: {
        default: null,
        parseHTML: (el) => el.getAttribute('data-suggestion-id'),
        renderHTML: (attrs) => ({ 'data-suggestion-id': attrs.suggestionId }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-suggestion-type="insert"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-suggestion-type': 'insert',
        style: [
          'color: #166534',
          'background: rgba(22,163,74,0.08)',
          'border-bottom: 2px solid #16a34a',
          'border-radius: 0.2rem',
          'padding: 0 0.1rem',
          'font-weight: 600',
        ].join(';'),
      }),
      0,
    ];
  },
});
