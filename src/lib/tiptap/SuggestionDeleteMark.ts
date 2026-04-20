import { Mark, mergeAttributes } from '@tiptap/core';

/**
 * TipTap Mark: Suggestion Delete
 *
 * Renders text that the teacher suggests removing.
 * Displayed as red strikethrough with a suggestion ID data attribute.
 */
export const SuggestionDeleteMark = Mark.create({
  name: 'suggestionDelete',

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
    return [{ tag: 'span[data-suggestion-type="delete"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-suggestion-type': 'delete',
        style: [
          'color: #dc2626',
          'background: rgba(220,38,38,0.08)',
          'text-decoration: line-through',
          'text-decoration-thickness: 2px',
          'text-decoration-color: #dc2626',
          'border-radius: 0.2rem',
          'padding: 0 0.1rem',
        ].join(';'),
      }),
      0,
    ];
  },
});
