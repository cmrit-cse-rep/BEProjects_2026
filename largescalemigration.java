package org.example;


import org.cloudsimplus.allocationpolicies.VmAllocationPolicyBestFit;
import org.cloudsimplus.allocationpolicies.VmAllocationPolicyRoundRobin;
import org.cloudsimplus.allocationpolicies.migration.*;
import org.cloudsimplus.builders.tables.CloudletsTableBuilder;
import org.cloudsimplus.builders.tables.HostHistoryTableBuilder;
import org.cloudsimplus.schedulers.vm.VmScheduler;
import org.cloudsimplus.selectionpolicies.VmSelectionPolicyMinimumUtilization;
import org.cloudsimplus.listeners.VmHostEventInfo;
import org.cloudsimplus.schedulers.MipsShare;
import org.cloudsimplus.cloudlets.Cloudlet;
import org.cloudsimplus.cloudlets.CloudletSimple;
import org.cloudsimplus.core.CloudSimPlus;
import org.cloudsimplus.datacenters.Datacenter;
import org.cloudsimplus.datacenters.DatacenterSimple;
import org.cloudsimplus.hosts.Host;
import org.cloudsimplus.hosts.HostSimple;
import org.cloudsimplus.schedulers.cloudlet.CloudletSchedulerTimeShared;
import org.cloudsimplus.schedulers.vm.VmSchedulerTimeShared;
import org.cloudsimplus.selectionpolicies.VmSelectionPolicy;
import org.cloudsimplus.util.Log;
import org.cloudsimplus.utilizationmodels.UtilizationModelDynamic;
import org.cloudsimplus.vms.HostResourceStats;
import org.cloudsimplus.vms.Vm;
import org.cloudsimplus.vms.VmSimple;
import org.cloudsimplus.allocationpolicies.VmAllocationPolicySimple;
import org.cloudsimplus.power.models.PowerModel;
import org.cloudsimplus.power.models.PowerModelHostSimple;


import java.io.BufferedWriter;
import java.io.FileWriter;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.*;

import static java.util.Comparator.comparingLong;

/**
 * Example: Large-scale VM migration simulation using CloudSim Plus.
 * This simulates a datacenter with many hosts and VMs,
 * and enables VM migration under a time-shared scheduling policy.
 */
public class largescalemigration {
    private static final int HOSTS = 50;        // large-scale number of hosts
    private static final int HOST_PES = 32;  //16
    private static final int VMS = 200;         // large-scale number of VMs
    private static final int VM_PES = 4;
    private static final int CLOUDLETS = 400;
    private static final int CLOUDLET_PES = 2;
    private static final int SCHEDULING_INTERVAL=10;

    private double total_power;

    private final CloudSimPlus simulation;
    private final List<Host> hostList;
    private final List<Vm> vmList;
    private final List<Cloudlet> cloudletList;
    int migrationsNumber=0;
    PrintWriter pr;

    public static void main(String[] args) {
        new largescalemigration();
    }

    public largescalemigration() {
//        Log.setLevel(Log.Level.WARN); // minimize log spam

        simulation = new CloudSimPlus();
        hostList = createHosts(HOSTS);
        // choose a VM selection policy (selects which VMs to migrate from overloaded hosts)
        var vmSelectionPolicy = new VmSelectionPolicyMinimumUtilization();
        var allocationPolicy =
                new myVmAllocationPolicyMigrationBestFitStaticThreshold(vmSelectionPolicy,0.5) ;



//        Datacenter datacenter = new DatacenterSimple(simulation, hostList, new VmAllocationPolicySimple());
        Datacenter datacenter = new DatacenterSimple(simulation, hostList, allocationPolicy);
        datacenter.getCharacteristics()
                .setCostPerSecond(0.01)
                .setCostPerMem(0.005)
                .setCostPerStorage(0.001)
                .setCostPerBw(0.0);

        datacenter.setSchedulingInterval(SCHEDULING_INTERVAL);
        datacenter.setHostSearchRetryDelay(60);
        vmList = createVms(VMS);
        cloudletList = createCloudlets(CLOUDLETS);

        // Create a broker and submit entities
        var broker = new org.cloudsimplus.brokers.DatacenterBrokerSimple(simulation);

//        for (int i = 0; i < vmList.size(); i++) {
//            broker.bindCloudletToVm(cloudletList.get(i), vmList.get(i));
//            if (i < vmList.size() * 0.7)
////                vmList.get(i).setHost(hostList.get(i % (HOSTS / 2))); // first half heavy
//                datacenter.getVmAllocationPolicy().allocateHostForVm(vmList.get(i),hostList.get(i % (HOSTS / 2)) );
//        }
        // 80% VMs on first 5 hosts → overloaded automatically
        for (int i = 0; i < vmList.size(); i++) {
            Host targetHost = (i < vmList.size() * 0.8)
                    ? hostList.get(i % 5)
                    : hostList.get(5 + (i % 5));
            datacenter.getVmAllocationPolicy().allocateHostForVm(vmList.get(i), targetHost);
        }

        broker.submitVmList(vmList);
        broker.submitCloudletList(cloudletList);

        vmList.forEach(vm -> vm.addOnMigrationStartListener(this::startMigration));
        vmList.forEach(vm -> vm.addOnMigrationFinishListener(this::finishMigration));

//
//        Map<Vm, Host> initialHostMap = new HashMap<>();
//        for (Vm vm : vmList) {
//            initialHostMap.put(vm, vm.getHost());
//        }

        // Enable VM migration

//        datacenter.setVmAllocationPolicy(new VmAllocationPolicySimple().setVmMigration(true));

        try {
            FileWriter fr= new FileWriter("log.txt") ;
            BufferedWriter br= new BufferedWriter(fr);
            pr=new PrintWriter(br);
            pr.println("LOG ");
        } catch (IOException e) {
            throw new RuntimeException(e);
        }

        System.out.println("▶ Starting simulation with " + HOSTS + " hosts and " + VMS + " VMs...");
        simulation.start();

        System.out.println("✅ Simulation finished.");
        broker.getCloudletFinishedList().forEach(this::printCloudletResults);

        final var cloudletFinishedList = broker.getCloudletFinishedList();
        final Comparator<Cloudlet> cloudletComparator =
                comparingLong((Cloudlet c) -> c.getVm().getHost().getId())
                        .thenComparingLong(c -> c.getVm().getId());
        cloudletFinishedList.sort(cloudletComparator);
        new CloudletsTableBuilder(cloudletFinishedList).build();


        hostList.stream().filter(h -> h.getId() <= HOSTS).forEach(this::printHostStateHistory);

        printHostsPowerConsumption();
//        printVMsPowerConsumption();

        System.out.printf("Number of VM migrations: %d%n", migrationsNumber);
        pr.printf("Number of VM migrations: %d%n", migrationsNumber);
        System.out.println(getClass().getSimpleName() + " finished!");

    }

    private void printHostsPowerConsumption()
    {
        for (final Host host :hostList)
        {
            final HostResourceStats cpuStats = host.getCpuUtilizationStats();

//The total Host's CPU utilization for the time specified by the map key
            final double utilizationPercentMean = cpuStats.getMean();
            final double watts = host.getPowerModel().getPower(utilizationPercentMean);
            total_power = total_power+watts;
            pr.printf("Host %2d CPU Usage mean: %6.1f%% | Power Consumption mean: %8.0f W%n",
                    host.getId(), utilizationPercentMean * 100, watts);
            System.out.printf(
                    "Host %2d CPU Usage mean: %6.1f%% | Power Consumption mean: %8.0f W%n",
                    host.getId(), utilizationPercentMean * 100, watts);
        }
        System.out.println("Total Power = "+total_power+"Watts");
    }
    /** Creates many hosts for large-scale simulation */
    private List<Host> createHosts(int number) {
        List<Host> list = new ArrayList<>(number);
        double idle[]={59.6,68.9,59.9,63.5,86.0,105.8,105.0};
        double max[]={118.5,119.0,150.4,129.0,117.0,209.3,169.0};
        for (int i = 0; i < number; i++) {

            double idl = idle[i%3];
            double mx = max[i%3] ;
            final var host = creatPowerHost(i,HOST_PES,1000,idl,mx);


//            Host host = new HostSimple(32768, 100000, 1000000, peList);
            host.setVmScheduler(new VmSchedulerTimeShared());
            host.setStateHistoryEnabled(true);
            list.add(host);
        }
        return list;
    }

    private Host creatPowerHost(final int id, int host_pes, long capa, double idle, double maxp){
        var peList = new ArrayList<org.cloudsimplus.resources.Pe>();
        for (int j = 0; j < HOST_PES; j++) {
            peList.add(new org.cloudsimplus.resources.PeSimple(1000)); // 1000 MIPS per PE
        }
        final long ram = 32768;
        final long bw = 100000;
        final long storage=1000000;
        final var vmScheduler = new VmSchedulerTimeShared();
        final var host = new HostSimple(ram,bw,storage,peList);

        final var powerModel= new PowerModelHostSimple(maxp,idle);
        powerModel.setStartupPower(5)
                .setShutDownPower(3);
        host.setId(id)
                .setVmScheduler(vmScheduler)
                .setPowerModel(powerModel);
        host.enableUtilizationStats();
        return host;
    }

    /** Creates many VMs */
    private List<Vm> createVms(int number) {
        List<Vm> list = new ArrayList<>(number);
        for (int i = 0; i < number; i++) {
            Vm vm = new VmSimple(1000, VM_PES)
                    .setRam(2048)
                    .setBw(10000)
                    .setSize(10000)
                    .setCloudletScheduler(new CloudletSchedulerTimeShared());
            list.add(vm);
        }
        return list;
    }

    /** Creates many Cloudlets */
//    private List<Cloudlet> createCloudlets(int number) {
//        List<Cloudlet> list = new ArrayList<>(number);
//        for (int i = 0; i < number; i++) {
//            Cloudlet cl = new CloudletSimple(500000, CLOUDLET_PES);
//            cl.setSizes(1024);
//            list.add(cl);
//        }
//        return list;
//    }
    private List<Cloudlet> createCloudlets(int number) {
        List<Cloudlet> list = new ArrayList<>(number);
        for (int i = 0; i < number; i++) {
            Cloudlet cl = new CloudletSimple(500000, CLOUDLET_PES);
            cl.setSizes(1024);

            // ADD THIS
            UtilizationModelDynamic model = new UtilizationModelDynamic(0.8);
            model.setUtilizationUpdateFunction(um ->
                    um.getUtilization() + 0.03   // grows usage over time
            );
            cl.setUtilizationModelCpu(model);

            list.add(cl);
        }
        return list;
    }


    /** Prints the results for each Cloudlet */
    private void printCloudletResults(Cloudlet cloudlet) {
        System.out.printf("Cloudlet %d executed on VM %d | Status: %s | Start: %.2f | Finish: %.2f%n",
                cloudlet.getId(),
                cloudlet.getVm().getId(),
                cloudlet.getStatus(),
                cloudlet.getArrivalTime(),
                cloudlet.getFinishTime());
    }

    private void startMigration(final VmHostEventInfo info) {
        final Vm vm = info.getVm();
        final Host targetHost = info.getHost();
        System.out.printf(
                "# %.2f: %s started migrating to %s (you can perform any operation you want here)%n",
                info.getTime(), vm, targetHost);
        showVmAllocatedMips(vm, targetHost, info.getTime());
        //VM current host (source)
        showHostAllocatedMips(info.getTime(), vm.getHost());
        //Migration host (target)
        showHostAllocatedMips(info.getTime(), targetHost);
        System.out.println();

        migrationsNumber++;
        if(migrationsNumber > 1){
            return;
        }

        //After the first VM starts being migrated, tracks some metrics along simulation time
        simulation.addOnClockTickListener(clock -> {
            if (clock.getTime() <= 2 || (clock.getTime() >= 11 && clock.getTime() <= 15))
                showVmAllocatedMips(vm, targetHost, clock.getTime());
        });
    }

    private void showVmAllocatedMips(final Vm vm, final Host targetHost, final double time) {
        final String msg = String.format("# %.2f: %s in %s: total allocated", time, vm, targetHost);
        final MipsShare allocatedMips = targetHost.getVmScheduler().getAllocatedMips(vm);
        final String msg2 = allocatedMips.totalMips() == vm.getMips() * 0.9 ? " - reduction due to migration overhead" : "";
        System.out.printf("%s %.0f MIPs (divided by %d PEs)%s\n", msg, allocatedMips.totalMips(), allocatedMips.pes(),msg2);
    }

    private void printHostStateHistory(final Host host) {
        new HostHistoryTableBuilder(host).setTitle(host.toString()).build();
    }

    private void finishMigration(final VmHostEventInfo info) {
        final var host = info.getHost();
        System.out.printf(
                "# %.2f: %s finished migrating to %s (you can perform any operation you want here)%n",
                info.getTime(), info.getVm(), host);
        System.out.print("\t\t");
        showHostAllocatedMips(info.getTime(), hostList.get(1));
        System.out.print("\t\t");
        showHostAllocatedMips(info.getTime(), host);
    }

    private void showHostAllocatedMips(final double time, final Host host) {
        System.out.printf(
                "%.2f: %s allocated %.2f MIPS from %.2f total capacity%n",
                time, host, host.getTotalAllocatedMips(), host.getTotalMipsCapacity());
    }
}

