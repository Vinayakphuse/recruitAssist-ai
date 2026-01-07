import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Plus, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const creditPackages = [
  {
    name: "Basic",
    price: 5,
    interviews: 20,
    features: ["Basic interview templates", "Email support"],
  },
  {
    name: "Standard",
    price: 12,
    interviews: 50,
    features: ["All interview templates", "Priority support", "Basic analytics"],
  },
  {
    name: "Pro",
    price: 25,
    interviews: 120,
    features: ["All interview templates", "24/7 support", "Advanced analytics"],
  },
];

export default function Billing() {
  const { profile } = useAuth();

  const handlePurchase = (packageName: string) => {
    toast({
      title: "Coming Soon",
      description: `Payment integration for ${packageName} package will be available soon.`,
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Billing</h1>
          <p className="text-muted-foreground">Manage your Payment and credits</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Your Credits */}
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Your Credits</CardTitle>
              <p className="text-sm text-muted-foreground">
                Current usage and remaining credits
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-4 border border-primary/20 rounded-lg bg-primary/5">
                <MessageSquare className="w-6 h-6 text-primary" />
                <span className="text-lg font-semibold text-primary">
                  {profile?.credits ?? 0} interviews left
                </span>
              </div>
              <Button className="w-full gap-2">
                <Plus className="w-4 h-4" />
                Add More Credits
              </Button>
            </CardContent>
          </Card>

          {/* Purchase Credits */}
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Purchase Credits</CardTitle>
              <p className="text-sm text-muted-foreground">
                Add more interview credits to your account
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {creditPackages.map((pkg) => (
                  <Card key={pkg.name} className="border">
                    <CardContent className="p-4 space-y-4">
                      <div>
                        <h3 className="font-semibold">{pkg.name}</h3>
                        <div className="flex items-baseline gap-1 mt-1">
                          <span className="text-2xl font-bold">${pkg.price}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {pkg.interviews} interviews
                        </p>
                      </div>
                      <ul className="space-y-2">
                        {pkg.features.map((feature, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-sm">
                            <Check className="w-4 h-4 text-primary" />
                            <span className="text-muted-foreground">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <Button
                        className="w-full"
                        onClick={() => handlePurchase(pkg.name)}
                      >
                        Purchase Credits
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
