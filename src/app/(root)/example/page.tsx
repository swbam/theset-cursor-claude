import { Metadata } from "next";

import { ClientDataExample } from "@/components/client-data-example";

export const metadata: Metadata = {
  title: "Client Data Example | TheSet",
  description: "Example of client-side data fetching in TheSet application",
};

export default function ExamplePage() {
  return (
    <div className="container py-6">
      <h1 className="text-3xl font-bold mb-6">Client Data Example</h1>
      <p className="mb-6 text-muted-foreground">
        This page demonstrates how to safely fetch data on the client side
        without importing Node.js modules. The data is fetched through our API
        routes, which handle the database access on the server.
      </p>

      <div className="border rounded-lg p-4 bg-card">
        <ClientDataExample />
      </div>
    </div>
  );
}
