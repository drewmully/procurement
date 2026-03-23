"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Save,
  Upload,
  Link2,
  Unlink,
  Loader2,
  Building,
  FileText,
  Settings as SettingsIcon,
  Users,
  Plug,
  CheckCircle2,
  XCircle,
  Plus,
} from "lucide-react";

interface CompanyProfile {
  companyName: string;
  legalName: string;
  taxId: string;
  address: string;
  phone: string;
  email: string;
  website: string;
}

interface ResaleCert {
  id: string;
  state: string;
  certificateNumber: string;
  expirationDate: string | null;
  documentUrl: string | null;
}

interface POSettings {
  poNumberPrefix: string;
  nextPoNumber: number;
  defaultNotes: string;
  approvalThreshold: number;
}

interface Integration {
  name: string;
  connected: boolean;
  lastSyncedAt: string | null;
  accountName: string | null;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

interface SettingsData {
  company: CompanyProfile;
  resaleCerts: ResaleCert[];
  poSettings: POSettings;
  integrations: Integration[];
  users: User[];
}

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY",
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("company");

  const { data, isLoading } = useQuery<SettingsData>({
    queryKey: ["settings"],
    queryFn: async () => {
      const res = await fetch("/api/settings");
      if (!res.ok) throw new Error("Failed to fetch settings");
      const json = await res.json();
      return json.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const company = data?.company ?? {
    companyName: "",
    legalName: "",
    taxId: "",
    address: "",
    phone: "",
    email: "",
    website: "",
  };
  const resaleCerts = data?.resaleCerts ?? [];
  const poSettings = data?.poSettings ?? {
    poNumberPrefix: "PO-",
    nextPoNumber: 1001,
    defaultNotes: "",
    approvalThreshold: 5000,
  };
  const integrations = data?.integrations ?? [
    { name: "Shopify", connected: false, lastSyncedAt: null, accountName: null },
    { name: "ShipHero", connected: false, lastSyncedAt: null, accountName: null },
  ];
  const users = data?.users ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">
          Manage your account and system preferences
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="company" className="gap-2">
            <Building className="h-4 w-4" />
            Company Profile
          </TabsTrigger>
          <TabsTrigger value="resale-certs" className="gap-2">
            <FileText className="h-4 w-4" />
            Resale Certs
          </TabsTrigger>
          <TabsTrigger value="po-settings" className="gap-2">
            <SettingsIcon className="h-4 w-4" />
            PO Settings
          </TabsTrigger>
          <TabsTrigger value="integrations" className="gap-2">
            <Plug className="h-4 w-4" />
            Integrations
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
        </TabsList>

        {/* Company Profile */}
        <TabsContent value="company" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Company Profile</CardTitle>
              <CardDescription>
                Your company information used across the system.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  // Save logic
                }}
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      defaultValue={company.companyName}
                      placeholder="MyMully LLC"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="legalName">Legal Name</Label>
                    <Input
                      id="legalName"
                      defaultValue={company.legalName}
                      placeholder="MyMully LLC"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="taxId">Tax ID / EIN</Label>
                    <Input
                      id="taxId"
                      defaultValue={company.taxId}
                      placeholder="XX-XXXXXXX"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      defaultValue={company.phone}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      defaultValue={company.email}
                      placeholder="procurement@mymully.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      defaultValue={company.website}
                      placeholder="https://mymully.com"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    defaultValue={company.address}
                    placeholder="Enter full company address"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end">
                  <Button type="submit">
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Resale Certificates */}
        <TabsContent value="resale-certs" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Resale Certificates</CardTitle>
                  <CardDescription>
                    Manage your resale certificates by state.
                  </CardDescription>
                </div>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Certificate
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {resaleCerts.length === 0 ? (
                <div className="py-8 text-center text-gray-500">
                  <FileText className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                  <p className="text-sm">No resale certificates added.</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Add certificates for states where you collect sales tax
                    exemptions.
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>State</TableHead>
                        <TableHead>Certificate Number</TableHead>
                        <TableHead>Expiration</TableHead>
                        <TableHead>Document</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {resaleCerts.map((cert) => (
                        <TableRow key={cert.id}>
                          <TableCell className="font-medium">
                            {cert.state}
                          </TableCell>
                          <TableCell>{cert.certificateNumber}</TableCell>
                          <TableCell>
                            {cert.expirationDate
                              ? new Date(
                                  cert.expirationDate
                                ).toLocaleDateString()
                              : "No expiration"}
                          </TableCell>
                          <TableCell>
                            {cert.documentUrl ? (
                              <a
                                href={cert.documentUrl}
                                className="text-blue-600 text-sm hover:underline"
                              >
                                View
                              </a>
                            ) : (
                              <Button variant="ghost" size="sm">
                                <Upload className="mr-1 h-3 w-3" />
                                Upload
                              </Button>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm">
                              Edit
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* PO Settings */}
        <TabsContent value="po-settings" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Purchase Order Settings</CardTitle>
              <CardDescription>
                Configure PO numbering, defaults, and approvals.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                className="space-y-6"
                onSubmit={(e) => {
                  e.preventDefault();
                }}
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="poPrefix">PO Number Prefix</Label>
                    <Input
                      id="poPrefix"
                      defaultValue={poSettings.poNumberPrefix}
                      placeholder="PO-"
                    />
                    <p className="text-xs text-gray-400">
                      Example: {poSettings.poNumberPrefix}
                      {poSettings.nextPoNumber}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nextPo">Next PO Number</Label>
                    <Input
                      id="nextPo"
                      type="number"
                      defaultValue={poSettings.nextPoNumber}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="defaultNotes">Default PO Notes</Label>
                  <Textarea
                    id="defaultNotes"
                    defaultValue={poSettings.defaultNotes}
                    placeholder="Default notes that appear on every new PO..."
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="approvalThreshold">
                    Approval Required Threshold ($)
                  </Label>
                  <Input
                    id="approvalThreshold"
                    type="number"
                    defaultValue={poSettings.approvalThreshold}
                    min={0}
                    step={100}
                  />
                  <p className="text-xs text-gray-400">
                    POs above this amount require approval before sending.
                    Set to 0 to require approval for all POs.
                  </p>
                </div>

                <div className="flex justify-end">
                  <Button type="submit">
                    <Save className="mr-2 h-4 w-4" />
                    Save Settings
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations */}
        <TabsContent value="integrations" className="mt-6">
          <div className="space-y-4">
            {integrations.map((integration) => (
              <Card key={integration.name}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100">
                        <Plug className="h-6 w-6 text-gray-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{integration.name}</h3>
                        {integration.connected ? (
                          <div className="flex items-center gap-2 mt-1">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <span className="text-sm text-green-600">
                              Connected
                              {integration.accountName &&
                                ` - ${integration.accountName}`}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 mt-1">
                            <XCircle className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-500">
                              Not connected
                            </span>
                          </div>
                        )}
                        {integration.lastSyncedAt && (
                          <p className="text-xs text-gray-400 mt-1">
                            Last synced:{" "}
                            {new Date(
                              integration.lastSyncedAt
                            ).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <div>
                      {integration.connected ? (
                        <Button variant="outline" size="sm">
                          <Unlink className="mr-2 h-4 w-4" />
                          Disconnect
                        </Button>
                      ) : (
                        <Button size="sm">
                          <Link2 className="mr-2 h-4 w-4" />
                          Connect
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Users */}
        <TabsContent value="users" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>
                    Manage who has access to the procurement system.
                  </CardDescription>
                </div>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Invite User
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {users.length === 0 ? (
                <div className="py-8 text-center text-gray-500">
                  <Users className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                  <p className="text-sm">No users configured.</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Invite team members to collaborate on procurement.
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            {user.name}
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{user.role}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={
                                user.status === "active"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-gray-100 text-gray-600"
                              }
                            >
                              {user.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm">
                              Edit
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
