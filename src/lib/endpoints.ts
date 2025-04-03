export interface Parameter {
  name: string;
  type: string;
  description: string;
}
export interface Endpoint {
  id: string;
  title: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
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
    };
  };
}

export const endpoints: Endpoint[] = [
  {
    id: "upload",
    title: "Upload Image",
    method: "POST",
    path: "/images",
    description: "Upload a new image to your account.",
    request: {
      description: "Upload a new image to your account.",
      headers:
        "Content-Type: multipart/form-data\nAuthorization: Bearer YOUR_API_KEY",
      parameters: [
        {
          name: "file",
          type: "File",
          description:
            "The image file to upload (max: 100MB premium, 50MB free)",
        },
        {
          name: "public",
          type: "Boolean",
          description: "Whether the image should be public (default: false)",
        },
      ],
    },
    response: {
      example: {
        id: "abc123",
        url: "https://custom-domain.com/abc123",
        filename: "example.png",
        size: 1024000,
        width: 1920,
        height: 1080,
        public: false,
        createdAt: "2024-04-01T12:00:00Z",
        baseUrl: "https://keiran.cc",
        customDomain: "custom-domain.com",
      },
    },
  },
  {
    id: "list",
    title: "List Images",
    method: "GET",
    path: "/images",
    description: "Get a list of all images in your account.",
    request: {
      description: "Get a list of all images in your account.",
      headers: "Authorization: Bearer YOUR_API_KEY",
      queryParameters: [
        {
          name: "page",
          type: "Integer",
          description: "Page number (default: 1)",
        },
        {
          name: "limit",
          type: "Integer",
          description: "Items per page (default: 20, max: 100)",
        },
        {
          name: "sort",
          type: "String",
          description: "Sort by (filename, size, createdAt)",
        },
        {
          name: "order",
          type: "String",
          description: "Sort order (asc, desc)",
        },
      ],
    },
    response: {
      example: {
        images: [
          {
            id: "abc123",
            url: "https://keiran.cc/abc123",
            displayUrl: "https://custom-domain.com/abc123",
            filename: "example.png",
            size: 1024000,
            width: 1920,
            height: 1080,
            public: false,
            createdAt: "2024-04-01T12:00:00Z",
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
        baseUrl: "https://keiran.cc",
      },
    },
  },
  {
    id: "delete",
    title: "Delete Image",
    method: "DELETE",
    path: "/images/:id",
    description: "Delete an image from your account.",
    request: {
      description: "Delete an image from your account.",
      headers: "Authorization: Bearer YOUR_API_KEY",
      pathParameters: [
        {
          name: "id",
          type: "String",
          description: "The ID of the image to delete",
        },
      ],
    },
    response: {
      example: {
        success: true,
        message: "Image deleted successfully",
      },
    },
  },
];
