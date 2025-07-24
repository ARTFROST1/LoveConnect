import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";

function WelcomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardContent className="p-6 text-center">
          <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center">
            <Heart className="w-12 h-12 text-primary" />
          </div>
          <h2 className="text-xl font-bold mb-2">Добро пожаловать в DuoLove!</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Добавьте партнёра, чтобы начать играть в мини-игры вместе
          </p>
          <Link href="/add-partner">
            <Button className="w-full bg-gradient-to-r from-primary to-secondary text-white">
              Добавить партнёра
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

export default WelcomePage;