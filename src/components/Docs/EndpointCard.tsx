import { motion } from "framer-motion";
import { Copy, ChevronDown, ChevronRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { Endpoint, Parameter } from "@/lib/endpoints";

const codeBlockVariants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  hover: {
    boxShadow: "0 0 0 2px var(--primary)",
    transition: { duration: 0.2 },
  },
};

interface EndpointCardProps {
  endpoint: Endpoint;
  isExpanded: boolean;
  onToggle: () => void;
}

interface ParameterTableProps {
  parameters: Parameter[];
  title: string;
}

const ParameterTable = ({ parameters, title }: ParameterTableProps) => (
  <div className="space-y-2">
    <h4 className="font-semibold">{title}</h4>
    <div className="border rounded-md divide-y">
      <div className="grid grid-cols-3 p-3">
        <div className="font-medium">Name</div>
        <div className="font-medium">Type</div>
        <div className="font-medium">Description</div>
      </div>
      {parameters.map((param) => (
        <div key={param.name} className="grid grid-cols-3 p-3">
          <div>{param.name}</div>
          <div>{param.type}</div>
          <div>{param.description}</div>
        </div>
      ))}
    </div>
  </div>
);

export function EndpointCard({
  endpoint,
  isExpanded,
  onToggle,
}: EndpointCardProps) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <Card>
      <CardHeader className="cursor-pointer" onClick={onToggle}>
        <div className="flex items-center justify-between">
          <CardTitle>{endpoint.title}</CardTitle>
          {isExpanded ? (
            <ChevronDown className="h-5 w-5" />
          ) : (
            <ChevronRight className="h-5 w-5" />
          )}
        </div>
        <CardDescription>
          {endpoint.method} {endpoint.path}
        </CardDescription>
      </CardHeader>
      {isExpanded && (
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-semibold">Request</h4>
            <p>{endpoint.request.description}</p>
            {endpoint.request.headers && (
              <motion.div
                className="bg-muted p-4 rounded-md font-mono text-sm relative"
                variants={codeBlockVariants}
                initial="initial"
                animate="animate"
                whileHover="hover"
              >
                <pre>{endpoint.request.headers}</pre>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={() =>
                    endpoint.request.headers &&
                    copyToClipboard(endpoint.request.headers)
                  }
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </motion.div>
            )}
          </div>

          {endpoint.request.parameters && (
            <ParameterTable
              parameters={endpoint.request.parameters}
              title="Parameters"
            />
          )}

          {endpoint.request.queryParameters && (
            <ParameterTable
              parameters={endpoint.request.queryParameters}
              title="Query Parameters"
            />
          )}

          {endpoint.request.pathParameters && (
            <ParameterTable
              parameters={endpoint.request.pathParameters}
              title="Path Parameters"
            />
          )}

          <div className="space-y-2">
            <h4 className="font-semibold">Response</h4>
            {endpoint.response.description && (
              <p>{endpoint.response.description}</p>
            )}
            <motion.div
              className="bg-muted p-4 rounded-md font-mono text-sm relative"
              variants={codeBlockVariants}
              initial="initial"
              animate="animate"
              whileHover="hover"
            >
              <pre>{JSON.stringify(endpoint.response.example, null, 2)}</pre>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2"
                onClick={() =>
                  copyToClipboard(
                    JSON.stringify(endpoint.response.example, null, 2),
                  )
                }
              >
                <Copy className="h-4 w-4" />
              </Button>
            </motion.div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
