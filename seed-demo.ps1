$token = (Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"demo@spendwise.com","password":"demo123456"}').token
$headers = @{ Authorization = "Bearer $token" }

# Get categories
$cats = (Invoke-RestMethod -Uri "http://localhost:5000/api/categories" -Headers $headers).data
$food    = ($cats | Where-Object { $_.name -eq 'Food & Dining' }).id
$transport = ($cats | Where-Object { $_.name -eq 'Transportation' }).id
$shopping = ($cats | Where-Object { $_.name -eq 'Shopping' }).id
$salary  = ($cats | Where-Object { $_.name -eq 'Salary' }).id
$freelance = ($cats | Where-Object { $_.name -eq 'Freelance' }).id
$health  = ($cats | Where-Object { $_.name -eq 'Healthcare' }).id
$utilities = ($cats | Where-Object { $_.name -eq 'Utilities' }).id
$entertainment = ($cats | Where-Object { $_.name -eq 'Entertainment' }).id

# Sample transactions for May 2026
$transactions = @(
  @{ type='income';  amount=55000; description='Monthly Salary';       date='2026-05-01'; categoryId=$salary;        merchant='TechCorp Ltd' },
  @{ type='income';  amount=12000; description='Freelance Project';    date='2026-05-02'; categoryId=$freelance;     merchant='Client ABC' },
  @{ type='expense'; amount=3200;  description='Grocery Shopping';     date='2026-05-01'; categoryId=$food;          merchant='Big Bazaar' },
  @{ type='expense'; amount=850;   description='Swiggy Order';         date='2026-05-02'; categoryId=$food;          merchant='Swiggy' },
  @{ type='expense'; amount=1200;  description='Uber Rides';           date='2026-05-03'; categoryId=$transport;     merchant='Uber' },
  @{ type='expense'; amount=4500;  description='Clothes Shopping';     date='2026-05-04'; categoryId=$shopping;      merchant='H&M' },
  @{ type='expense'; amount=2200;  description='Doctor Visit';         date='2026-05-05'; categoryId=$health;        merchant='City Clinic' },
  @{ type='expense'; amount=1800;  description='Electricity Bill';     date='2026-05-06'; categoryId=$utilities;     merchant='BESCOM' },
  @{ type='expense'; amount=600;   description='Netflix & Spotify';    date='2026-05-07'; categoryId=$entertainment; merchant='Netflix' },
  @{ type='expense'; amount=750;   description='Morning Coffee Runs';  date='2026-05-08'; categoryId=$food;          merchant='Starbucks' },
  @{ type='expense'; amount=1100;  description='Metro Card Recharge';  date='2026-05-09'; categoryId=$transport;     merchant='BMRCL' },
  @{ type='expense'; amount=5600;  description='Amazon Purchase';      date='2026-05-10'; categoryId=$shopping;      merchant='Amazon' },
  @{ type='expense'; amount=900;   description='Restaurant Dinner';    date='2026-05-11'; categoryId=$food;          merchant='Mainland China' },
  @{ type='income';  amount=3000;  description='Interest Income';      date='2026-05-12'; categoryId=$freelance;     merchant='HDFC Bank' },
  @{ type='expense'; amount=2800;  description='Internet & Mobile';    date='2026-05-13'; categoryId=$utilities;     merchant='Airtel' }
)

foreach ($tx in $transactions) {
  $body = $tx | ConvertTo-Json
  try {
    Invoke-RestMethod -Uri "http://localhost:5000/api/transactions" -Method POST -ContentType "application/json" -Headers $headers -Body $body | Out-Null
    Write-Host "Added: $($tx.description)"
  } catch {
    Write-Host "Failed: $($tx.description) - $_"
  }
}

# Set some budgets
$budgets = @(
  @{ categoryId=$food;    limit=8000;  month=5; year=2026 },
  @{ categoryId=$transport; limit=3000; month=5; year=2026 },
  @{ categoryId=$shopping; limit=6000;  month=5; year=2026 },
  @{ categoryId=$health;  limit=3000;  month=5; year=2026 },
  @{ categoryId=$utilities; limit=3500; month=5; year=2026 }
)

foreach ($b in $budgets) {
  $body = $b | ConvertTo-Json
  Invoke-RestMethod -Uri "http://localhost:5000/api/budgets" -Method POST -ContentType "application/json" -Headers $headers -Body $body | Out-Null
  Write-Host "Budget set for category"
}

Write-Host "`n✅ Demo data seeded successfully!"
