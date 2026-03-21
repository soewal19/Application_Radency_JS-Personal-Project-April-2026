export const AI_MODULE_OPTIONS = 'AI_MODULE_OPTIONS';

export const AI_TOOL_DEFINITIONS = [
  {
    type: 'function',
    function: {
      name: 'searchEvents',
      description: 'Search for events by city, date range, and category. Returns a list of matching events.',
      parameters: {
        type: 'object',
        properties: {
          city: {
            type: 'string',
            description: 'City where the user wants to find events, e.g. "Kyiv"',
          },
          date_from: {
            type: 'string',
            format: 'date',
            description: 'Start date for the search (YYYY-MM-DD).',
          },
          date_to: {
            type: 'string',
            format: 'date',
            description: 'End date for the search (YYYY-MM-DD).',
          },
          category: {
            type: 'string',
            enum: ['meetup', 'conference', 'workshop', 'webinar', 'social', 'sport', 'festival'],
            description: 'Optional event category filter.',
          },
          limit: {
            type: 'integer',
            minimum: 1,
            maximum: 25,
            description: 'Maximum number of events to return.',
          },
        },
        required: ['city'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getEventDetails',
      description: 'Get full details for a single event. Use this when the user asks for specifics about a particular event.',
      parameters: {
        type: 'object',
        properties: {
          event_id: {
            type: 'string',
            description: 'The unique ID of the event.',
          },
        },
        required: ['event_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'createEvent',
      description: 'Create a new event with the specified details. Always ask for confirmation before creating.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Title of the event' },
          description: { type: 'string', description: 'Detailed description' },
          date: { type: 'string', format: 'date-time', description: 'ISO 8601 date and time' },
          location: { type: 'string', description: 'Where the event happens' },
          category: {
            type: 'string',
            enum: ['meetup', 'conference', 'workshop', 'webinar', 'social', 'sport', 'festival'],
            description: 'Category of the event',
          },
          maxParticipants: { type: 'integer', minimum: 1, description: 'Max number of people' },
          tags: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of tags for the event (max 5)',
          },
        },
        required: ['title', 'date', 'location', 'category', 'maxParticipants'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'updateEvent',
      description: 'Update an existing event. Only the fields provided will be updated. Always ask for confirmation before updating.',
      parameters: {
        type: 'object',
        properties: {
          event_id: { type: 'string', description: 'The unique ID of the event to update' },
          title: { type: 'string' },
          description: { type: 'string' },
          date: { type: 'string', format: 'date-time' },
          location: { type: 'string' },
          category: {
            type: 'string',
            enum: ['meetup', 'conference', 'workshop', 'webinar', 'social', 'sport', 'festival'],
          },
          maxParticipants: { type: 'integer', minimum: 1 },
          tags: { type: 'array', items: { type: 'string' } },
        },
        required: ['event_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'deleteEvent',
      description: 'Delete an event by its ID. Always ask for confirmation before deleting.',
      parameters: {
        type: 'object',
        properties: {
          event_id: { type: 'string', description: 'The unique ID of the event to delete' },
        },
        required: ['event_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getEventsStats',
      description: 'Get statistics about events, such as counts by category, total participants, and upcoming events summary. Use this when the user asks for "statistics", "stats", or "analytics".',
      parameters: {
        type: 'object',
        properties: {
          scope: { 
            type: 'string', 
            enum: ['all', 'my'], 
            description: 'Whether to get stats for all public events or only events created by the user.' 
          },
        },
      },
    },
  },
];
