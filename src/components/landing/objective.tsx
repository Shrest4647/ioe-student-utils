import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export function Objective() {
  return (
    <section aria-labelledby="mission-heading" className="px-4 py-16">
      <div className="mx-auto max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-3xl" id="mission-heading">
              Our Mission
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-8 text-lg text-muted-foreground">
              IOE Student Utils is a community-driven ecosystem designed to
              assist students and graduates in their academic journey. We
              provide essential tools and resources to simplify the process of
              applying to universities abroad and meeting international academic
              standards.
            </p>
            <Separator aria-hidden="true" className="my-8" />
            <div className="flex flex-wrap justify-center gap-4">
              <Badge className="px-4 py-2 text-lg" variant="secondary">
                Open Source
              </Badge>
              <Badge className="px-4 py-2 text-lg" variant="secondary">
                Community Driven
              </Badge>
              <Badge className="px-4 py-2 text-lg" variant="secondary">
                Student Centric
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
