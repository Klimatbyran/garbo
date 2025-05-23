import { getLEINumber } from '../src/lib/wikidata';

const env = 'http://localhost:3000/api';
const secret = '123F';

async function getApiToken(user: string) {
  const response = await fetch(`${env}/auth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: user,
      client_secret: secret,
    }),
  })

  return (await response.json()).token
}

async function updateLEI(wikidataId: string, token: string, lei: string) {
  const response = await fetch(
    `${env}/companies/${wikidataId}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ lei, wikidataId }),
    }
  );
  return response;
}

async function getCompanies(): Promise<{lei: string, wikidataId: string}[]> {
  const response = await fetch(`${env}/companies`);
  return (await response.json());
}

async function pushLeiNumbers(): Promise<string[]> {
  const token = await getApiToken('garbo');
  const updatedCompanies: string[] = [];
  const companies = await getCompanies();

  for(const company of companies) {
    if(!company.lei) {
      console.log(`fetching LEI for ${company.wikidataId}`)
      const lei = await getLEINumber(company.wikidataId as `Q${number}`);
      if(lei) {
        await updateLEI(company.wikidataId, token, lei);
        updatedCompanies.push(company.wikidataId);
      }
    }
  }
  console.log(updatedCompanies.length);
  return updatedCompanies;
}

pushLeiNumbers();
