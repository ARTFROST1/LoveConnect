import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link } from 'wouter';

export default function TestReferralLink() {
  const [referralCode, setReferralCode] = useState('ref_803210627_test123');

  const simulateReferralClick = () => {
    // Симулируем переход по реферальной ссылке через URL параметр
    const testUrl = `/?ref=${referralCode}`;
    window.location.href = testUrl;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <div className="max-w-2xl mx-auto pt-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
            Тест реферальной ссылки
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Симуляция перехода по реферальной ссылке
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Тестирование реферального перехода</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="referralCode">Реферальный код для тестирования</Label>
              <Input
                id="referralCode"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                placeholder="ref_803210627_test123"
              />
              <p className="text-xs text-gray-500 mt-1">
                Введите реферальный код другого пользователя
              </p>
            </div>

            <Button onClick={simulateReferralClick} className="w-full">
              Симулировать переход по реферальной ссылке
            </Button>
            
            <div className="text-center pt-4">
              <Link href="/referral-test" className="text-blue-600 dark:text-blue-400 hover:underline">
                ← Вернуться к основному тесту
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Инструкции</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Введите реферальный код от другого пользователя</li>
              <li>Нажмите кнопку "Симулировать переход"</li>
              <li>Приложение должно показать экран "Обрабатываем реферальную ссылку..."</li>
              <li>После обработки должно появиться подтверждение подключения</li>
              <li>Пользователи станут партнерами</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}