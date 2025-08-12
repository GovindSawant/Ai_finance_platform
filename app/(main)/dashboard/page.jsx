import { getDashboardData, getUserAccounts } from '@/actions/dashboard';
import { Card, CardContent } from '@/components/ui/card';
import { CreateAccountDrawer } from '@/components/ui/create-account-drawer';
import { Plus } from 'lucide-react';
import React from 'react'
import { AccountCard } from './_components/account-card';
import { getCurrentBudget } from '@/actions/budget';
import { BudgetProgress } from '../account/_components/budget-progress';
import { DashboardOverview } from './_components/transaction-overview';

async function DashboardPage () {

  const accounts = await getUserAccounts();

  const defaultAccount = accounts?.find((account) => account.isDefault);

  const transactions = await getDashboardData();

  // Get budget for default account
  let budgetData = null;
  if (defaultAccount) {
    budgetData = await getCurrentBudget(defaultAccount.id);
  }

  return (
  <div className='px-5'>
    {/* Budget Progress */}
      <BudgetProgress
        initialBudget={budgetData?.budget}
        currentExpenses={budgetData?.currentExpenses || 0}
      />

    {/* Overview */}
    <DashboardOverview
        accounts={accounts}
        transactions={transactions || []}
    />

    {/* Accounts Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <CreateAccountDrawer>
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-dashed">
            <CardContent className="flex flex-col items-center justify-center text-muted-foreground h-full pt-5">
              <Plus className="h-10 w-10 mb-2" />
              <p className="text-sm font-medium">Add New Account</p>
            </CardContent>
          </Card>
        </CreateAccountDrawer>
        {accounts.length > 0 &&
          accounts?.map((account) => (
            <AccountCard key={account.id} account={account} />
          ))}
      </div>
  </div>
  );
}

export default DashboardPage