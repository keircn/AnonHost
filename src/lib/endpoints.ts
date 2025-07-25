export interface Parameter {
  name: string;
  type: string;
  description: string;
}
export interface Endpoint {
  id: string;
  title: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  description: string;
  request: {
    description: string;
    headers?: string;
    parameters?: Parameter[];
    queryParameters?: Parameter[];
    pathParameters?: Parameter[];
  };
  response: {
    description?: string;
    example: {
      id?: string;
      url?: string;
      displayUrl?: string;
      filename?: string;
      size?: number;
      width?: number;
      height?: number;
      public?: boolean;
      createdAt?: string;
      baseUrl?: string;
      customDomain?: string;
      success?: boolean;
      message?: string;
      originalUrl?: string;
      shortUrl?: string;
      title?: string;
      expireAt?: string;
      images?: Array<{
        id: string;
        url: string;
        displayUrl: string;
        filename: string;
        size: number;
        width: number;
        height: number;
        public: boolean;
        createdAt: string;
      }>;
      pagination?: {
        total: number;
        page: number;
        limit: number;
        pages: number;
      };
      stats?: {
        totalUploads: number;
        storageUsed: number;
        apiRequests: number;
      };
      shortlinks?: Array<{
        id: string;
        originalUrl: string;
        title?: string;
        shortUrl: string;
        clicks?: number;
        public?: boolean;
        createdAt: string;
        expireAt?: string;
      }>;
      clicks?: number;
      count?: number;
    };
  };
}

export const endpoints: Endpoint[] = [
  {
    id: 'upload',
    title: 'Upload Image',
    method: 'POST',
    path: '/images',
    description: 'Upload a new image to your account.',
    request: {
      description: 'Upload a new image to your account.',
      headers:
        'Content-Type: multipart/form-data\nAuthorization: Bearer YOUR_API_KEY',
      parameters: [
        {
          name: 'file',
          type: 'File',
          description:
            'The image file to upload (max: 100MB premium, 50MB free)',
        },
        {
          name: 'public',
          type: 'Boolean',
          description: 'Whether the image should be public (default: false)',
        },
      ],
    },
    response: {
      example: {
        id: 'abc123',
        url: 'https://custom-domain.com/abc123',
        filename: 'example.png',
        size: 1024000,
        width: 1920,
        height: 1080,
        public: false,
        createdAt: '2024-04-01T12:00:00Z',
        baseUrl: 'https://anon.love',
        customDomain: 'custom-domain.com',
      },
    },
  },
  {
    id: 'list',
    title: 'List Images',
    method: 'GET',
    path: '/images',
    description: 'Get a list of all images in your account.',
    request: {
      description: 'Get a list of all images in your account.',
      headers: 'Authorization: Bearer YOUR_API_KEY',
      queryParameters: [
        {
          name: 'page',
          type: 'Integer',
          description: 'Page number (default: 1)',
        },
        {
          name: 'limit',
          type: 'Integer',
          description: 'Items per page (default: 20, max: 100)',
        },
        {
          name: 'sort',
          type: 'String',
          description: 'Sort by (filename, size, createdAt)',
        },
        {
          name: 'order',
          type: 'String',
          description: 'Sort order (asc, desc)',
        },
      ],
    },
    response: {
      example: {
        images: [
          {
            id: 'abc123',
            url: 'https://anon.love/abc123',
            displayUrl: 'https://custom-domain.com/abc123',
            filename: 'example.png',
            size: 1024000,
            width: 1920,
            height: 1080,
            public: false,
            createdAt: '2024-04-01T12:00:00Z',
          },
        ],
        pagination: {
          total: 42,
          page: 1,
          limit: 20,
          pages: 3,
        },
        stats: {
          totalUploads: 42,
          storageUsed: 128.5,
          apiRequests: 150,
        },
        baseUrl: 'https://anon.love',
      },
    },
  },
  {
    id: 'delete',
    title: 'Delete Image',
    method: 'DELETE',
    path: '/images/:id',
    description: 'Delete an image from your account.',
    request: {
      description: 'Delete an image from your account.',
      headers: 'Authorization: Bearer YOUR_API_KEY',
      pathParameters: [
        {
          name: 'id',
          type: 'String',
          description: 'The ID of the image to delete',
        },
      ],
    },
    response: {
      example: {
        success: true,
        message: 'Image deleted successfully',
      },
    },
  },
  {
    id: 'create-shortlink',
    title: 'Create Shortlink',
    method: 'POST',
    path: '/shortener',
    description: 'Create a new URL shortlink.',
    request: {
      description: 'Create a new shortened URL with optional customization.',
      headers: 'Authorization: Bearer YOUR_API_KEY',
      parameters: [
        {
          name: 'originalUrl',
          type: 'String',
          description: 'The URL to shorten (required)',
        },
        {
          name: 'title',
          type: 'String',
          description: 'Optional title for the shortlink',
        },
        {
          name: 'expiresIn',
          type: 'Integer',
          description: 'Days until the shortlink expires (optional)',
        },
        {
          name: 'public',
          type: 'Boolean',
          description:
            'Whether the shortlink should be public (default: false)',
        },
      ],
    },
    response: {
      example: {
        id: 'abc123',
        originalUrl: 'https://example.com/very-long-url',
        title: 'Example Link',
        shortUrl: 'https://anon.love/s/abc123',
        public: false,
        createdAt: '2024-04-01T12:00:00Z',
        expireAt: '2024-05-01T12:00:00Z',
      },
    },
  },
  {
    id: 'list-shortlinks',
    title: 'List Shortlinks',
    method: 'GET',
    path: '/shortener',
    description: 'Get a list of all your shortlinks.',
    request: {
      description: 'Retrieve all shortlinks associated with your account.',
      headers: 'Authorization: Bearer YOUR_API_KEY',
    },
    response: {
      example: {
        shortlinks: [
          {
            id: 'abc123',
            originalUrl: 'https://example.com/very-long-url',
            title: 'Example Link',
            shortUrl: 'https://anon.love/s/abc123',
            clicks: 42,
            public: false,
            createdAt: '2024-04-01T12:00:00Z',
            expireAt: '2024-05-01T12:00:00Z',
          },
        ],
        count: 1,
      },
    },
  },
  {
    id: 'get-shortlink',
    title: 'Get Shortlink',
    method: 'GET',
    path: '/shortener/:id',
    description: 'Get details about a specific shortlink.',
    request: {
      description: 'Retrieve information about a specific shortlink by ID.',
      headers: 'Authorization: Bearer YOUR_API_KEY',
      pathParameters: [
        {
          name: 'id',
          type: 'String',
          description: 'The ID of the shortlink',
        },
      ],
    },
    response: {
      example: {
        id: 'abc123',
        originalUrl: 'https://example.com/very-long-url',
        title: 'Example Link',
        shortUrl: 'https://anon.love/s/abc123',
        clicks: 42,
        public: false,
        createdAt: '2024-04-01T12:00:00Z',
        expireAt: '2024-05-01T12:00:00Z',
      },
    },
  },
  {
    id: 'update-shortlink',
    title: 'Update Shortlink',
    method: 'PUT',
    path: '/shortener/:id',
    description: 'Update an existing shortlink.',
    request: {
      description: 'Modify the properties of an existing shortlink.',
      headers: 'Authorization: Bearer YOUR_API_KEY',
      pathParameters: [
        {
          name: 'id',
          type: 'String',
          description: 'The ID of the shortlink to update',
        },
      ],
      parameters: [
        {
          name: 'originalUrl',
          type: 'String',
          description: 'New URL to redirect to',
        },
        {
          name: 'title',
          type: 'String',
          description: 'New title for the shortlink',
        },
        {
          name: 'expiresIn',
          type: 'Integer',
          description: 'New expiration period in days',
        },
        {
          name: 'public',
          type: 'Boolean',
          description: 'Update visibility status',
        },
      ],
    },
    response: {
      example: {
        id: 'abc123',
        originalUrl: 'https://example.com/updated-url',
        title: 'Updated Link',
        shortUrl: 'https://anon.love/s/abc123',
        clicks: 42,
        public: true,
        createdAt: '2024-04-01T12:00:00Z',
        expireAt: '2024-05-01T12:00:00Z',
      },
    },
  },
  {
    id: 'delete-shortlink',
    title: 'Delete Shortlink',
    method: 'DELETE',
    path: '/shortener/:id',
    description: 'Delete a shortlink.',
    request: {
      description: 'Permanently delete a shortlink by ID.',
      headers: 'Authorization: Bearer YOUR_API_KEY',
      pathParameters: [
        {
          name: 'id',
          type: 'String',
          description: 'The ID of the shortlink to delete',
        },
      ],
    },
    response: {
      example: {
        message: 'Shortlink deleted successfully',
      },
    },
  },
];
