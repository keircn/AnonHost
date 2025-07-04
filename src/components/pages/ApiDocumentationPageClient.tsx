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
import { Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { endpoints } from "@/lib/endpoints";
import { EndpointCard } from "@/components/Docs/EndpointCard";

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

export function ApiDocumentationPageClient() {
  const { toast } = useToast();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Code snippet copied to clipboard",
    });
  };

  const toggleSection = (section: string) => {
    if (expandedSection === section) {
      setExpandedSection(null);
    } else {
      setExpandedSection(section);
    }
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
                        <pre>https://anon.love/api</pre>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2"
                          onClick={() =>
                            copyToClipboard("https://anon.love/api")
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
                {endpoints.map((endpoint, index) => (
                  <motion.div
                    key={endpoint.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <EndpointCard
                      endpoint={endpoint}
                      isExpanded={expandedSection === endpoint.id}
                      onToggle={() => toggleSection(endpoint.id)}
                    />
                  </motion.div>
                ))}
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

fetch('https://anon.love/api/images', {
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
                                      : `fetch('https://anon.love/images?page=1&limit=50', {
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

fetch('https://anon.love/images', {
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
                                          : `fetch('https://anon.love/images?page=1&limit=50', {
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

url = "https://anon.love/images"
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

url = "https://anon.love/images"
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

url = "https://anon.love/images"
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

url = "https://anon.love/images"
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
                                      ? `curl -X POST https://anon.love/images \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -F "file=@image.jpg" \\
  -F "filename=custom-name.jpg" \\
  -F "public=true"`
                                      : `curl -X GET "https://anon.love/images?page=1&limit=50" \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
                                  </pre>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute top-2 right-2"
                                    onClick={() =>
                                      copyToClipboard(
                                        example === "Upload an Image"
                                          ? `curl -X POST https://anon.love/images \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -F "file=@image.jpg" \\
  -F "filename=custom-name.jpg" \\
  -F "public=true"`
                                          : `curl -X GET "https://anon.love/images?page=1&limit=50" \\
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
