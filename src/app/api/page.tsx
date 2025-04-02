"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Copy, ChevronDown, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const staggerContainer = {
  animate: {
    transition: { staggerChildren: 0.1 },
  },
};

const tabVariants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
};

const codeBlockVariants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  hover: {
    boxShadow: "0 0 0 2px var(--primary)",
    transition: { duration: 0.2 },
  },
};

export default function ApiDocumentationPage() {
  const { toast } = useToast();
  const [expandedSection, setExpandedSection] = useState<string | null>(
    "upload",
  );
  const [activeTab, setActiveTab] = useState("overview");

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Code snippet copied to clipboard",
    });
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <motion.div
      className="container py-8"
      variants={fadeIn}
      initial="initial"
      animate="animate"
    >
      <motion.h1 className="text-3xl font-bold mb-2" variants={fadeIn}>
        API Documentation
      </motion.h1>
      <motion.p className="text-muted-foreground mb-6" variants={fadeIn}>
        Integrate AnonHost with your applications using our simple REST API
      </motion.p>

      <Tabs
        defaultValue="overview"
        className="w-full"
        onValueChange={setActiveTab}
      >
        <motion.div variants={fadeIn}>
          <TabsList className="mb-4">
            {["overview", "endpoints", "examples"].map((tab, index) => (
              <motion.div
                key={tab}
                variants={tabVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ delay: index * 0.1 }}
              >
                <TabsTrigger value={tab}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </TabsTrigger>
              </motion.div>
            ))}
          </TabsList>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            variants={fadeIn}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <TabsContent value="overview">
              <motion.div
                className="space-y-6"
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Getting Started</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Authentication</h3>
                      <p>
                        All API requests require authentication using an API
                        key. You can generate API keys in your account settings.
                      </p>
                      <p>
                        Include your API key in the request headers as follows:
                      </p>
                      <motion.div
                        className="bg-muted p-4 rounded-md font-mono text-sm relative"
                        variants={codeBlockVariants}
                        initial="initial"
                        animate="animate"
                        whileHover="hover"
                      >
                        <pre>Authorization: Bearer YOUR_API_KEY</pre>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2"
                          onClick={() =>
                            copyToClipboard(
                              "Authorization: Bearer YOUR_API_KEY",
                            )
                          }
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </motion.div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Base URL</h3>
                      <p>
                        All API endpoints are relative to the following base
                        URL:
                      </p>
                      <motion.div
                        className="bg-muted p-4 rounded-md font-mono text-sm relative"
                        variants={codeBlockVariants}
                        initial="initial"
                        animate="animate"
                        whileHover="hover"
                      >
                        <pre>https://keiran.cc/api</pre>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2"
                          onClick={() =>
                            copyToClipboard("https://keiran.cc/api")
                          }
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </motion.div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="endpoints">
              <motion.div className="space-y-6" variants={staggerContainer}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card>
                    <CardHeader
                      className="cursor-pointer"
                      onClick={() => toggleSection("upload")}
                    >
                      <div className="flex items-center justify-between">
                        <CardTitle>Upload Image</CardTitle>
                        {expandedSection === "upload" ? (
                          <ChevronDown className="h-5 w-5" />
                        ) : (
                          <ChevronRight className="h-5 w-5" />
                        )}
                      </div>
                      <CardDescription>POST /images</CardDescription>
                    </CardHeader>
                    {expandedSection === "upload" && (
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <h4 className="font-semibold">Request</h4>
                          <p>Upload a new image to your account.</p>
                          <motion.div
                            className="bg-muted p-4 rounded-md font-mono text-sm relative"
                            variants={codeBlockVariants}
                            initial="initial"
                            animate="animate"
                            whileHover="hover"
                          >
                            <pre>
                              POST /images
                              <br />
                              Content-Type: multipart/form-data
                              <br />
                              Authorization: Bearer YOUR_API_KEY
                            </pre>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute top-2 right-2"
                              onClick={() =>
                                copyToClipboard(
                                  "POST /images\nContent-Type: multipart/form-data\nAuthorization: Bearer YOUR_API_KEY",
                                )
                              }
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </motion.div>
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-semibold">Parameters</h4>
                          <div className="border rounded-md divide-y">
                            <div className="grid grid-cols-3 p-3">
                              <div className="font-medium">Name</div>
                              <div className="font-medium">Type</div>
                              <div className="font-medium">Description</div>
                            </div>
                            <div className="grid grid-cols-3 p-3">
                              <div>file</div>
                              <div>File</div>
                              <div>
                                The image file to upload (max: 100MB premium,
                                50MB free)
                              </div>
                            </div>
                            <div className="grid grid-cols-3 p-3">
                              <div>public</div>
                              <div>Boolean</div>
                              <div>
                                Whether the image should be public (default:
                                false)
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-semibold">Response</h4>
                          <motion.div
                            className="bg-muted p-4 rounded-md font-mono text-sm relative"
                            variants={codeBlockVariants}
                            initial="initial"
                            animate="animate"
                            whileHover="hover"
                          >
                            <pre>
                              {`{
  "id": "abc123",
  "url": "https://custom-domain.com/abc123",
  "filename": "example.png",
  "size": 1024000,
  "width": 1920,
  "height": 1080,
  "public": false,
  "createdAt": "2024-04-01T12:00:00Z",
  "baseUrl": "https://keiran.cc",
  "customDomain": "custom-domain.com"
}`}
                            </pre>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute top-2 right-2"
                              onClick={() =>
                                copyToClipboard(`{
  "id": "abc123",
  "url": "https://custom-domain.com/abc123",
  "filename": "example.png",
  "size": 1024000,
  "width": 1920,
  "height": 1080,
  "public": false,
  "createdAt": "2024-04-01T12:00:00Z",
  "baseUrl": "https://keiran.cc",
  "customDomain": "custom-domain.com"
}`)
                              }
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </motion.div>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  <Card>
                    <CardHeader
                      className="cursor-pointer"
                      onClick={() => toggleSection("list")}
                    >
                      <div className="flex items-center justify-between">
                        <CardTitle>List Images</CardTitle>
                        {expandedSection === "list" ? (
                          <ChevronDown className="h-5 w-5" />
                        ) : (
                          <ChevronRight className="h-5 w-5" />
                        )}
                      </div>
                      <CardDescription>GET /images</CardDescription>
                    </CardHeader>
                    {expandedSection === "list" && (
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <h4 className="font-semibold">Request</h4>
                          <p>Get a list of all images in your account.</p>
                          <motion.div
                            className="bg-muted p-4 rounded-md font-mono text-sm relative"
                            variants={codeBlockVariants}
                            initial="initial"
                            animate="animate"
                            whileHover="hover"
                          >
                            <pre>
                              GET /images
                              <br />
                              Authorization: Bearer YOUR_API_KEY
                            </pre>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute top-2 right-2"
                              onClick={() =>
                                copyToClipboard(
                                  "GET /images\nAuthorization: Bearer YOUR_API_KEY",
                                )
                              }
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </motion.div>
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-semibold">Query Parameters</h4>
                          <div className="border rounded-md divide-y">
                            <div className="grid grid-cols-3 p-3">
                              <div className="font-medium">Name</div>
                              <div className="font-medium">Type</div>
                              <div className="font-medium">Description</div>
                            </div>
                            <div className="grid grid-cols-3 p-3">
                              <div>page</div>
                              <div>Integer</div>
                              <div>Page number (default: 1)</div>
                            </div>
                            <div className="grid grid-cols-3 p-3">
                              <div>limit</div>
                              <div>Integer</div>
                              <div>Items per page (default: 20, max: 100)</div>
                            </div>
                            <div className="grid grid-cols-3 p-3">
                              <div>sort</div>
                              <div>String</div>
                              <div>Sort by (filename, size, createdAt)</div>
                            </div>
                            <div className="grid grid-cols-3 p-3">
                              <div>order</div>
                              <div>String</div>
                              <div>Sort order (asc, desc)</div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-semibold">
                            List Images Response
                          </h4>
                          <motion.div
                            className="bg-muted p-4 rounded-md font-mono text-sm relative"
                            variants={codeBlockVariants}
                            initial="initial"
                            animate="animate"
                            whileHover="hover"
                          >
                            <pre>
                              {`{
  "images": [
    {
      "id": "abc123",
      "url": "https://keiran.cc/abc123",
      "displayUrl": "https://custom-domain.com/abc123",
      "filename": "example.png",
      "size": 1024000,
      "width": 1920,
      "height": 1080,
      "public": false,
      "createdAt": "2024-04-01T12:00:00Z"
    }
  ],
  "pagination": {
    "total": 42,
    "page": 1,
    "limit": 20,
    "pages": 3
  },
  "stats": {
    "totalUploads": 42,
    "storageUsed": 128.5,
    "apiRequests": 150
  },
  "baseUrl": "https://keiran.cc"
}`}
                            </pre>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute top-2 right-2"
                              onClick={() =>
                                copyToClipboard(`{
  "images": [
    {
      "id": "123456",
      "url": "https://keiran.cc/123456",
      "filename": "example1.png",
      "size": 1024000,
      "width": 1920,
      "height": 1080,
      "public": false,
      "createdAt": "1970-01-01T00:00:00Z"
    },
    {
      "id": "img_789012",
      "url": "https://anonhost.cc/789012",
      "filename": "example2.jpg",
      "size": 512000,
      "width": 1280,
      "height": 720,
      "public": true,
      "createdAt": "1970-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "total": 42,
    "page": 1,
    "limit": 20,
    "pages": 3
  }
}`)
                              }
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </motion.div>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                  exit="exit"
                >
                  <Card>
                    <CardHeader
                      className="cursor-pointer"
                      onClick={() => toggleSection("delete")}
                    >
                      <div className="flex items-center justify-between">
                        <CardTitle>Delete Image</CardTitle>
                        {expandedSection === "delete" ? (
                          <ChevronDown className="h-5 w-5" />
                        ) : (
                          <ChevronRight className="h-5 w-5" />
                        )}
                      </div>
                      <CardDescription>DELETE /images/:id</CardDescription>
                    </CardHeader>
                    {expandedSection === "delete" && (
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <h4 className="font-semibold">Request</h4>
                          <p>Delete an image from your account.</p>
                          <motion.div
                            className="bg-muted p-4 rounded-md font-mono text-sm relative"
                            variants={codeBlockVariants}
                            initial="initial"
                            animate="animate"
                            whileHover="hover"
                          >
                            <pre>
                              DELETE /images/img_123456
                              <br />
                              Authorization: Bearer YOUR_API_KEY
                            </pre>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute top-2 right-2"
                              onClick={() =>
                                copyToClipboard(
                                  "DELETE /images/img_123456\nAuthorization: Bearer YOUR_API_KEY",
                                )
                              }
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </motion.div>
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-semibold">Path Parameters</h4>
                          <div className="border rounded-md divide-y">
                            <div className="grid grid-cols-3 p-3">
                              <div className="font-medium">Name</div>
                              <div className="font-medium">Type</div>
                              <div className="font-medium">Description</div>
                            </div>
                            <div className="grid grid-cols-3 p-3">
                              <div>id</div>
                              <div>String</div>
                              <div>The ID of the image to delete</div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-semibold">Response</h4>
                          <motion.div
                            className="bg-muted p-4 rounded-md font-mono text-sm relative"
                            variants={codeBlockVariants}
                            initial="initial"
                            animate="animate"
                            whileHover="hover"
                          >
                            <pre>
                              {`{
  "success": true,
  "message": "Image deleted successfully"
}`}
                            </pre>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute top-2 right-2"
                              onClick={() =>
                                copyToClipboard(`{
  "success": true,
  "message": "Image deleted successfully"
}`)
                              }
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </motion.div>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                </motion.div>
              </motion.div>
            </TabsContent>

            <TabsContent value="examples">
              <motion.div
                className="space-y-6"
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Code Examples</CardTitle>
                    <CardDescription>
                      Example code snippets for common API operations
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {["Upload an Image", "List All Images"].map(
                      (example, index) => (
                        <motion.div
                          key={example}
                          variants={fadeIn}
                          initial="initial"
                          animate="animate"
                          transition={{ delay: index * 0.2 }}
                        >
                          <div className="space-y-4">
                            <h3 className="text-lg font-semibold">{example}</h3>

                            <Tabs defaultValue="js" className="w-full">
                              <TabsList>
                                <TabsTrigger value="js">JavaScript</TabsTrigger>
                                <TabsTrigger value="python">Python</TabsTrigger>
                                <TabsTrigger value="curl">cURL</TabsTrigger>
                              </TabsList>

                              <TabsContent value="js" className="mt-4">
                                <motion.div
                                  className="bg-muted p-4 rounded-md font-mono text-sm relative"
                                  variants={codeBlockVariants}
                                  initial="initial"
                                  animate="animate"
                                  whileHover="hover"
                                >
                                  <pre>
                                    {example === "Upload an Image"
                                      ? `const form = new FormData();
form.append('file', fileInput.files[0]);
form.append('filename', 'custom-name.jpg');
form.append('public', 'true');

fetch('https://keiran.cc/api/images', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: form
})
.then(response => response.json())
.then(data => {
  console.log('Success:', data);
})
.catch(error => {
  console.error('Error:', error);
});`
                                      : `fetch('https://keiran.cc/images?page=1&limit=50', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY'
  }
})
.then(response => response.json())
.then(data => {
  console.log('Images:', data.images);
  console.log('Pagination:', data.pagination);
})
.catch(error => {
  console.error('Error:', error);
});`}
                                  </pre>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute top-2 right-2"
                                    onClick={() =>
                                      copyToClipboard(
                                        example === "Upload an Image"
                                          ? `const form = new FormData();
form.append('file', fileInput.files[0]);
form.append('filename', 'custom-name.jpg');
form.append('public', 'true');

fetch('https://keiran.cc/images', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: form
})
.then(response => response.json())
.then(data => {
  console.log('Success:', data);
})
.catch(error => {
  console.error('Error:', error);
});`
                                          : `fetch('https://keiran.cc/images?page=1&limit=50', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY'
  }
})
.then(response => response.json())
.then(data => {
  console.log('Images:', data.images);
  console.log('Pagination:', data.pagination);
})
.catch(error => {
  console.error('Error:', error);
});`,
                                      )
                                    }
                                  >
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                </motion.div>
                              </TabsContent>

                              <TabsContent value="python" className="mt-4">
                                <motion.div
                                  className="bg-muted p-4 rounded-md font-mono text-sm relative"
                                  variants={codeBlockVariants}
                                  initial="initial"
                                  animate="animate"
                                  whileHover="hover"
                                >
                                  <pre>
                                    {example === "Upload an Image"
                                      ? `import requests

url = "https://keiran.cc/images"
headers = {
    "Authorization": "Bearer YOUR_API_KEY"
}

files = {
    "file": open("image.jpg", "rb")
}

data = {
    "filename": "custom-name.jpg",
    "public": "true"
}

response = requests.post(url, headers=headers, files=files, data=data)
print(response.json())`
                                      : `import requests

url = "https://keiran.cc/images"
headers = {
    "Authorization": "Bearer YOUR_API_KEY"
}
params = {
    "page": 1,
    "limit": 50
}

response = requests.get(url, headers=headers, params=params)
data = response.json()

print("Images:", data["images"])
print("Pagination:", data["pagination"])`}
                                  </pre>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute top-2 right-2"
                                    onClick={() =>
                                      copyToClipboard(
                                        example === "Upload an Image"
                                          ? `import requests

url = "https://keiran.cc/images"
headers = {
    "Authorization": "Bearer YOUR_API_KEY"
}

files = {
    "file": open("image.jpg", "rb")
}

data = {
    "filename": "custom-name.jpg",
    "public": "true"
}

response = requests.post(url, headers=headers, files=files, data=data)
print(response.json())`
                                          : `import requests

url = "https://keiran.cc/images"
headers = {
    "Authorization": "Bearer YOUR_API_KEY"
}
params = {
    "page": 1,
    "limit": 50
}

response = requests.get(url, headers=headers, params=params)
data = response.json()

print("Images:", data["images"])
print("Pagination:", data["pagination"])`,
                                      )
                                    }
                                  >
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                </motion.div>
                              </TabsContent>

                              <TabsContent value="curl" className="mt-4">
                                <motion.div
                                  className="bg-muted p-4 rounded-md font-mono text-sm relative"
                                  variants={codeBlockVariants}
                                  initial="initial"
                                  animate="animate"
                                  whileHover="hover"
                                >
                                  <pre>
                                    {example === "Upload an Image"
                                      ? `curl -X POST https://keiran.cc/images \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -F "file=@image.jpg" \\
  -F "filename=custom-name.jpg" \\
  -F "public=true"`
                                      : `curl -X GET "https://keiran.cc/images?page=1&limit=50" \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
                                  </pre>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute top-2 right-2"
                                    onClick={() =>
                                      copyToClipboard(
                                        example === "Upload an Image"
                                          ? `curl -X POST https://keiran.cc/images \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -F "file=@image.jpg" \\
  -F "filename=custom-name.jpg" \\
  -F "public=true"`
                                          : `curl -X GET "https://keiran.cc/images?page=1&limit=50" \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
                                      )
                                    }
                                  >
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                </motion.div>
                              </TabsContent>
                            </Tabs>
                          </div>
                        </motion.div>
                      ),
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          </motion.div>
        </AnimatePresence>
      </Tabs>
    </motion.div>
  );
}
