"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { endpoints } from "@/lib/endpoints";
import { EndpointCard } from "@/components/Docs/EndpointCard";
import { CodeBlock } from "@/components/Docs/CodeBlock";

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

const uploadJavaScript = `const file = fileInput.files[0];

const init = await fetch('https://anonhost.cc/api/media', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    action: 'direct-init',
    fileName: file.name,
    fileSize: file.size,
    contentType: file.type || 'application/octet-stream'
  })
}).then(r => r.json());

await fetch(init.data.uploadUrl, {
  method: 'PUT',
  headers: { 'Content-Type': file.type || 'application/octet-stream' },
  body: file
});

const done = await fetch('https://anonhost.cc/api/media', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    action: 'direct-finalize',
    imageId: init.data.imageId,
    objectKey: init.data.objectKey,
    public: true
  })
}).then(r => r.json());

console.log('Success:', done);`;

const uploadPython = `import requests

url = "https://anonhost.cc/api/media"
headers = {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
}

file_path = "image.jpg"
with open(file_path, "rb") as f:
    file_bytes = f.read()

init_payload = {
    "action": "direct-init",
    "fileName": "image.jpg",
    "fileSize": len(file_bytes),
    "contentType": "image/jpeg"
}

init_res = requests.post(url, headers=headers, json=init_payload)
init_data = init_res.json()

put_res = requests.put(
    init_data["data"]["uploadUrl"],
    headers={"Content-Type": "image/jpeg"},
    data=file_bytes,
)
put_res.raise_for_status()

finalize_payload = {
    "action": "direct-finalize",
    "imageId": init_data["data"]["imageId"],
    "objectKey": init_data["data"]["objectKey"],
    "public": True,
}

done = requests.post(url, headers=headers, json=finalize_payload)
print(done.json())`;

const uploadCurl = `# 1) init
curl -X POST https://anonhost.cc/api/media \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"action":"direct-init","fileName":"image.jpg","fileSize":1024000,"contentType":"image/jpeg"}'

# 2) upload to returned uploadUrl
curl -X PUT "<uploadUrl>" \\
  -H "Content-Type: image/jpeg" \\
  --data-binary "@image.jpg"

# 3) finalize
curl -X POST https://anonhost.cc/api/media \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"action":"direct-finalize","imageId":"<imageId>","objectKey":"<objectKey>","public":true}'`;

const listJavaScript = `fetch('https://anonhost.cc/api/media?page=1&limit=50', {
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
});`;

const listPython = `import requests

url = "https://anonhost.cc/api/media"
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
print("Pagination:", data["pagination"])`;

const listCurl = `curl -X GET "https://anonhost.cc/api/media?page=1&limit=50" \\
  -H "Authorization: Bearer YOUR_API_KEY"`;

export function ApiDocumentationPageClient() {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  const toggleSection = (section: string) => {
    setExpandedSection((prev) => (prev === section ? null : section));
  };

  const examples = [
    {
      title: "Upload an Image",
      js: uploadJavaScript,
      python: uploadPython,
      curl: uploadCurl,
    },
    {
      title: "List All Images",
      js: listJavaScript,
      python: listPython,
      curl: listCurl,
    },
  ];

  return (
    <motion.div className="container py-8" variants={fadeIn} initial="initial" animate="animate">
      <motion.h1 className="mb-2 text-3xl font-bold" variants={fadeIn}>
        API Documentation
      </motion.h1>
      <motion.p className="text-muted-foreground mb-6" variants={fadeIn}>
        Integrate AnonHost with your applications using our simple REST API
      </motion.p>

      <Tabs defaultValue="overview" className="w-full" onValueChange={setActiveTab}>
        <motion.div variants={fadeIn}>
          <TabsList className="mb-4">
            {[
              { id: "overview", label: "Overview" },
              { id: "endpoints", label: "Endpoints" },
              { id: "examples", label: "Examples" },
            ].map((tab, index) => (
              <motion.div
                key={tab.id}
                variants={tabVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ delay: index * 0.1 }}
              >
                <TabsTrigger value={tab.id}>{tab.label}</TabsTrigger>
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
                        All API requests require authentication using an API key. You can generate
                        API keys in your account settings.
                      </p>
                      <p>Include your API key in the request headers as follows:</p>
                      <CodeBlock code="Authorization: Bearer YOUR_API_KEY" language="http" />
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Base URL</h3>
                      <p>All API endpoints are relative to the following base URL:</p>
                      <CodeBlock code="https://anonhost.cc/api" language="bash" />
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
                    {examples.map((example, index) => (
                      <motion.div
                        key={example.title}
                        variants={fadeIn}
                        initial="initial"
                        animate="animate"
                        transition={{ delay: index * 0.2 }}
                      >
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold">{example.title}</h3>

                          <Tabs defaultValue="js" className="w-full">
                            <TabsList>
                              <TabsTrigger value="js">JavaScript</TabsTrigger>
                              <TabsTrigger value="python">Python</TabsTrigger>
                              <TabsTrigger value="curl">cURL</TabsTrigger>
                            </TabsList>

                            <TabsContent value="js" className="mt-4">
                              <CodeBlock code={example.js} language="javascript" />
                            </TabsContent>

                            <TabsContent value="python" className="mt-4">
                              <CodeBlock code={example.python} language="python" />
                            </TabsContent>

                            <TabsContent value="curl" className="mt-4">
                              <CodeBlock code={example.curl} language="bash" />
                            </TabsContent>
                          </Tabs>
                        </div>
                      </motion.div>
                    ))}
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
