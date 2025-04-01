"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Copy, ChevronDown, ChevronRight } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { motion } from "framer-motion"

export default function ApiDocumentationPage() {
  const { toast } = useToast()
  const [expandedSection, setExpandedSection] = useState<string | null>("upload")
  const [apiKey, setApiKey] = useState("")

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied to clipboard",
      description: "Code snippet copied to clipboard",
    })
  }

  const toggleSection = (section: string) => {
    if (expandedSection === section) {
      setExpandedSection(null)
    } else {
      setExpandedSection(section)
    }
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-2">API Documentation</h1>
      <p className="text-muted-foreground mb-6">Integrate ImageHost with your applications using our simple REST API</p>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
          <TabsTrigger value="examples">Examples</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
              <CardDescription>
                Learn how to use the ImageHost API to upload and manage your images programmatically
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Authentication</h3>
                <p>
                  All API requests require authentication using an API key. You can generate API keys in your account
                  settings.
                </p>
                <p>Include your API key in the request headers as follows:</p>
                <div className="bg-muted p-4 rounded-md font-mono text-sm relative">
                  <pre>Authorization: Bearer YOUR_API_KEY</pre>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard("Authorization: Bearer YOUR_API_KEY")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Base URL</h3>
                <p>All API endpoints are relative to the following base URL:</p>
                <div className="bg-muted p-4 rounded-md font-mono text-sm relative">
                  <pre>https://api.imagehost.com/v1</pre>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard("https://api.imagehost.com/v1")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Rate Limits</h3>
                <p>The API has rate limits to ensure fair usage:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>100 requests per minute</li>
                  <li>1000 requests per hour</li>
                  <li>10,000 requests per day</li>
                </ul>
                <p>If you exceed these limits, you'll receive a 429 Too Many Requests response.</p>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Try the API</h3>
                <p>Enter your API key to test the API directly from the documentation:</p>
                <div className="flex gap-4">
                  <div className="grid w-full gap-1.5">
                    <Label htmlFor="api-key">Your API Key</Label>
                    <Input
                      id="api-key"
                      placeholder="img_..."
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                    />
                  </div>
                  <Button className="self-end">Save</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="endpoints">
          <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <Card>
                <CardHeader className="cursor-pointer" onClick={() => toggleSection("upload")}>
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
                      <div className="bg-muted p-4 rounded-md font-mono text-sm relative">
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
                      </div>
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
                          <div>The image file to upload</div>
                        </div>
                        <div className="grid grid-cols-3 p-3">
                          <div>filename</div>
                          <div>String</div>
                          <div>Optional custom filename</div>
                        </div>
                        <div className="grid grid-cols-3 p-3">
                          <div>public</div>
                          <div>Boolean</div>
                          <div>Whether the image should be public (default: false)</div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-semibold">Response</h4>
                      <div className="bg-muted p-4 rounded-md font-mono text-sm relative">
                        <pre>
                          {`{
  "id": "img_123456",
  "url": "https://imagehost.com/i/img_123456",
  "filename": "example.png",
  "size": 1024000,
  "width": 1920,
  "height": 1080,
  "public": false,
  "createdAt": "2023-04-01T12:00:00Z"
}`}
                        </pre>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2"
                          onClick={() =>
                            copyToClipboard(`{
  "id": "img_123456",
  "url": "https://imagehost.com/i/img_123456",
  "filename": "example.png",
  "size": 1024000,
  "width": 1920,
  "height": 1080,
  "public": false,
  "createdAt": "2023-04-01T12:00:00Z"
}`)
                          }
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
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
                <CardHeader className="cursor-pointer" onClick={() => toggleSection("list")}>
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
                      <div className="bg-muted p-4 rounded-md font-mono text-sm relative">
                        <pre>
                          GET /images
                          <br />
                          Authorization: Bearer YOUR_API_KEY
                        </pre>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2"
                          onClick={() => copyToClipboard("GET /images\nAuthorization: Bearer YOUR_API_KEY")}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
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
                          <div>Sort order (created_at, size, filename)</div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-semibold">Response</h4>
                      <div className="bg-muted p-4 rounded-md font-mono text-sm relative">
                        <pre>
                          {`{
  "images": [
    {
      "id": "img_123456",
      "url": "https://imagehost.com/i/img_123456",
      "filename": "example1.png",
      "size": 1024000,
      "width": 1920,
      "height": 1080,
      "public": false,
      "createdAt": "2023-04-01T12:00:00Z"
    },
    {
      "id": "img_789012",
      "url": "https://imagehost.com/i/img_789012",
      "filename": "example2.jpg",
      "size": 512000,
      "width": 1280,
      "height": 720,
      "public": true,
      "createdAt": "2023-04-02T14:30:00Z"
    }
  ],
  "pagination": {
    "total": 42,
    "page": 1,
    "limit": 20,
    "pages": 3
  }
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
      "id": "img_123456",
      "url": "https://imagehost.com/i/img_123456",
      "filename": "example1.png",
      "size": 1024000,
      "width": 1920,
      "height": 1080,
      "public": false,
      "createdAt": "2023-04-01T12:00:00Z"
    },
    {
      "id": "img_789012",
      "url": "https://imagehost.com/i/img_789012",
      "filename": "example2.jpg",
      "size": 512000,
      "width": 1280,
      "height": 720,
      "public": true,
      "createdAt": "2023-04-02T14:30:00Z"
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
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <Card>
                <CardHeader className="cursor-pointer" onClick={() => toggleSection("delete")}>
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
                      <div className="bg-muted p-4 rounded-md font-mono text-sm relative">
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
                            copyToClipboard("DELETE /images/img_123456\nAuthorization: Bearer YOUR_API_KEY")
                          }
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
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
                      <div className="bg-muted p-4 rounded-md font-mono text-sm relative">
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
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            </motion.div>
          </div>
        </TabsContent>

        <TabsContent value="examples">
          <Card>
            <CardHeader>
              <CardTitle>Code Examples</CardTitle>
              <CardDescription>Example code snippets for common API operations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Upload an Image</h3>

                <Tabs defaultValue="js" className="w-full">
                  <TabsList>
                    <TabsTrigger value="js">JavaScript</TabsTrigger>
                    <TabsTrigger value="python">Python</TabsTrigger>
                    <TabsTrigger value="curl">cURL</TabsTrigger>
                  </TabsList>

                  <TabsContent value="js" className="mt-4">
                    <div className="bg-muted p-4 rounded-md font-mono text-sm relative">
                      <pre>
                        {`const form = new FormData();
form.append('file', fileInput.files[0]);
form.append('filename', 'custom-name.jpg');
form.append('public', 'true');

fetch('https://api.imagehost.com/v1/images', {
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
});`}
                      </pre>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={() =>
                          copyToClipboard(`const form = new FormData();
form.append('file', fileInput.files[0]);
form.append('filename', 'custom-name.jpg');
form.append('public', 'true');

fetch('https://api.imagehost.com/v1/images', {
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
});`)
                        }
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="python" className="mt-4">
                    <div className="bg-muted p-4 rounded-md font-mono text-sm relative">
                      <pre>
                        {`import requests

url = "https://api.imagehost.com/v1/images"
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
print(response.json())`}
                      </pre>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={() =>
                          copyToClipboard(`import requests

url = "https://api.imagehost.com/v1/images"
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
print(response.json())`)
                        }
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="curl" className="mt-4">
                    <div className="bg-muted p-4 rounded-md font-mono text-sm relative">
                      <pre>
                        {`curl -X POST https://api.imagehost.com/v1/images \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -F "file=@image.jpg" \\
  -F "filename=custom-name.jpg" \\
  -F "public=true"`}
                      </pre>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={() =>
                          copyToClipboard(`curl -X POST https://api.imagehost.com/v1/images \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -F "file=@image.jpg" \\
  -F "filename=custom-name.jpg" \\
  -F "public=true"`)
                        }
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">List All Images</h3>

                <Tabs defaultValue="js" className="w-full">
                  <TabsList>
                    <TabsTrigger value="js">JavaScript</TabsTrigger>
                    <TabsTrigger value="python">Python</TabsTrigger>
                    <TabsTrigger value="curl">cURL</TabsTrigger>
                  </TabsList>

                  <TabsContent value="js" className="mt-4">
                    <div className="bg-muted p-4 rounded-md font-mono text-sm relative">
                      <pre>
                        {`fetch('https://api.imagehost.com/v1/images?page=1&limit=50', {
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
                          copyToClipboard(`fetch('https://api.imagehost.com/v1/images?page=1&limit=50', {
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
});`)
                        }
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="python" className="mt-4">
                    <div className="bg-muted p-4 rounded-md font-mono text-sm relative">
                      <pre>
                        {`import requests

url = "https://api.imagehost.com/v1/images"
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
                          copyToClipboard(`import requests

url = "https://api.imagehost.com/v1/images"
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
print("Pagination:", data["pagination"])`)
                        }
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="curl" className="mt-4">
                    <div className="bg-muted p-4 rounded-md font-mono text-sm relative">
                      <pre>
                        {`curl -X GET "https://api.imagehost.com/v1/images?page=1&limit=50" \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
                      </pre>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={() =>
                          copyToClipboard(`curl -X GET "https://api.imagehost.com/v1/images?page=1&limit=50" \\
  -H "Authorization: Bearer YOUR_API_KEY"`)
                        }
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

