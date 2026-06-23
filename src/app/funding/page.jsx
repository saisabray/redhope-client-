export const dynamic = 'force-dynamic';
import { getAllFunding } from '@/lib/Api/funding';
import FundingClient from './FundingClient';

export default async function FundingPage() {
    let fundings = [];
    try {
        const response = await getAllFunding();
        // ensure we have an array
        if (Array.isArray(response)) {
            fundings = response;
        } else if (response && Array.isArray(response.data)) {
            fundings = response.data;
        }
    } catch (err) {
        console.error("Failed to fetch fundings:", err);
    }
    
    return <FundingClient initialFundings={fundings} />;
}