import { ChevronDown, ChevronRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Endpoint, Parameter } from "@/lib/endpoints";
import { CodeBlock } from "@/components/Docs/CodeBlock";

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
    <div className="divide-y rounded-md border">
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

export function EndpointCard({ endpoint, isExpanded, onToggle }: EndpointCardProps) {
  return (
    <Card>
      <CardHeader className="cursor-pointer" onClick={onToggle}>
        <div className="flex items-center justify-between">
          <CardTitle>{endpoint.title}</CardTitle>
          {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
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
              <div>
                <CodeBlock code={endpoint.request.headers} language="http" />
              </div>
            )}
          </div>

          {endpoint.request.parameters && (
            <ParameterTable parameters={endpoint.request.parameters} title="Parameters" />
          )}

          {endpoint.request.queryParameters && (
            <ParameterTable
              parameters={endpoint.request.queryParameters}
              title="Query Parameters"
            />
          )}

          {endpoint.request.pathParameters && (
            <ParameterTable parameters={endpoint.request.pathParameters} title="Path Parameters" />
          )}

          <div className="space-y-2">
            <h4 className="font-semibold">Response</h4>
            {endpoint.response.description && <p>{endpoint.response.description}</p>}
            <div>
              <CodeBlock
                code={JSON.stringify(endpoint.response.example, null, 2)}
                language="json"
              />
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
