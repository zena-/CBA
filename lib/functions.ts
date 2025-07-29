export const functions = [
  {
    name: 'getFrozenTreatIdeas',
    description: 'Suggests frozen treat recipes based on user’s pantry and local sales.',
    parameters: {
      type: 'object',
      properties: {
        ingredients: {
          type: 'array',
          items: { type: 'string' },
          description: 'Available pantry items',
        },
        nearbySales: {
          type: 'array',
          items: { type: 'string' },
          description: 'Items currently on sale nearby',
        },
      },
      required: ['ingredients'],
    },
  },
];

export const getFrozenTreatIdeas = async ({ ingredients, nearbySales }: {
  ingredients: string[];
  nearbySales?: string[];
}) => {
  // Simple rule-based response for now
  if (ingredients.includes('blueberries') && ingredients.includes('milk')) {
    return {
      recipe: 'Blueberry Chili B. Apple Ice Cream',
      steps: [
        'Blend blueberries, milk, and one Chili B. Apple together.',
        'Freeze mixture in ice cube trays.',
        'Once frozen, blend again into soft-serve consistency.',
      ],
      suggestions: nearbySales?.length ? `Also on sale nearby: ${nearbySales.join(', ')}` : null,
    };
  }

  return { recipe: 'Sorry, not enough ingredients for a frozen treat.' };
};
