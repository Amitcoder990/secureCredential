import { useEffect, useState } from "react";
import NetInfo, { NetInfoState } from "@react-native-community/netinfo";

export function useNetwork() {
    const [isConnected, setIsConnected] = useState<boolean | null>(null);
    const [details, setDetails] = useState<NetInfoState | null>(null);

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener((state) => {
            setIsConnected(state.isConnected ?? false);
            setDetails(state);
        });

        // Initial check
        NetInfo.fetch().then((state) => {
            setIsConnected(state.isConnected ?? false);
            setDetails(state);
        });

        return () => unsubscribe();
    }, []);

    return { isConnected, details };
}
