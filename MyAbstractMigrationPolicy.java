//package org.example;
//
////
//// Source code recreated from a .class file by IntelliJ IDEA
//// (powered by FernFlower decompiler)
////
//
//
//
//import java.util.ArrayList;
//import java.util.Collections;
//import java.util.Comparator;
//import java.util.HashMap;
//import java.util.HashSet;
//import java.util.LinkedList;
//import java.util.List;
//import java.util.Map;
//import java.util.Optional;
//import java.util.Set;
//import java.util.function.BiFunction;
//import java.util.function.Predicate;
//import java.util.stream.Collectors;
//import lombok.NonNull;
//import org.cloudsimplus.allocationpolicies.VmAllocationPolicy;
//import org.cloudsimplus.allocationpolicies.VmAllocationPolicyAbstract;
//import org.cloudsimplus.allocationpolicies.migration.VmAllocationPolicyMigration;
//import org.cloudsimplus.datacenters.Datacenter;
//import org.cloudsimplus.hosts.Host;
//import org.cloudsimplus.selectionpolicies.VmSelectionPolicy;
//import org.cloudsimplus.util.TimeUtil;
//import org.cloudsimplus.vms.Vm;
//import org.cloudsimplus.vms.VmSimple;
//
//public abstract class MyAbstractMigrationPolicy extends VmAllocationPolicyAbstract implements VmAllocationPolicyMigration {
//    public static final double DEF_UNDERLOAD_THRESHOLD = 0.35;
//    private double underUtilizationThreshold;
//    private @NonNull VmSelectionPolicy vmSelectionPolicy;
//    private boolean underloaded;
//    private boolean overloaded;
//    private final Map<Vm, Host> savedAllocation;
//    private Datacenter targetMigrationDc;
//    private int targetMigrationDcIndex;
//
//    public MyAbstractMigrationPolicy(VmSelectionPolicy vmSelectionPolicy) {
//        this(vmSelectionPolicy, (BiFunction)null);
//    }
//
//    public MyAbstractMigrationPolicy(VmSelectionPolicy vmSelectionPolicy, BiFunction<VmAllocationPolicy, Vm, Optional<Host>> findHostForVmFunction) {
//        super(findHostForVmFunction);
//        this.underUtilizationThreshold = 0.35;
//        this.savedAllocation = new HashMap();
//        this.setVmSelectionPolicy(vmSelectionPolicy);
//    }
//
//    public VmAllocationPolicyAbstract setDatacenter(Datacenter datacenter) {
//        super.setDatacenter(datacenter);
//        this.targetMigrationDc = datacenter;
//        return this;
//    }
//
//    public Map<Vm, Host> getOptimizedAllocationMap(List<? extends Vm> vmList) {
//        Set<Host> overloadedHosts = this.getOverloadedHosts();
//        this.overloaded = !overloadedHosts.isEmpty();
//        this.printOverUtilizedHosts(overloadedHosts);
//        Map<Vm, Host> migrationMap = this.getMigrationMapFromOverloadedHosts(overloadedHosts);
//        this.updateMigrationMapFromUnderloadedHosts(overloadedHosts, migrationMap);
//        if (this.overloaded && migrationMap.isEmpty()) {
//            this.hostSearchRetry();
//        }
//
//        return migrationMap;
//    }
//
//    private void hostSearchRetry() {
//        List<Datacenter> dcList = this.getDatacenter().getSimulation().getCis().getDatacenterList();
//        double hostSearchRetryDelay = this.getDatacenter().getHostSearchRetryDelay();
//        String msg = hostSearchRetryDelay > (double)0.0F ? "in " + TimeUtil.secondsToStr(hostSearchRetryDelay) : "as soon as possible";
//        boolean singleDc = dcList.size() == 1;
//        String targetDcName = !singleDc && !this.getDatacenter().equals(this.targetMigrationDc) ? "on %s ".formatted(this.targetMigrationDc) : "";
//        LOGGER.warn("{}: {}: An under or overload situation was detected on {}, however there aren't suitable Hosts {}to manage that. Trying again {}.", new Object[]{this.getDatacenter().getSimulation().clock(), this.getClass().getSimpleName(), this.getDatacenter(), targetDcName, msg});
//        if (!singleDc) {
//            this.targetMigrationDcIndex = ++this.targetMigrationDcIndex % dcList.size();
//            this.targetMigrationDc = (Datacenter)dcList.get(this.targetMigrationDcIndex);
//        }
//
//    }
//
//    private void updateMigrationMapFromUnderloadedHosts(Set<Host> overloadedHosts, Map<Vm, Host> migrationMap) {
//        List<Host> switchedOffHosts = this.getSwitchedOffHosts();
//        Set<Host> ignoredSourceHosts = this.getIgnoredHosts(overloadedHosts, switchedOffHosts);
//        ignoredSourceHosts.addAll(migrationMap.values());
//        Set<Host> ignoredTargetHosts = this.getIgnoredHosts(overloadedHosts, switchedOffHosts);
//        int numberOfHosts = this.getHostList().size();
//        this.underloaded = false;
//
//        while(numberOfHosts != ignoredSourceHosts.size()) {
//            Host underloadedHost = this.getUnderloadedHost(ignoredSourceHosts);
//            if (Host.NULL.equals(underloadedHost)) {
//                break;
//            }
//
//            this.underloaded = true;
//            LOGGER.info("{}: VmAllocationPolicy: Underloaded hosts: {}", this.getDatacenter().getSimulation().clockStr(), underloadedHost);
//            ignoredSourceHosts.add(underloadedHost);
//            ignoredTargetHosts.add(underloadedHost);
//            List<? extends Vm> vmsToMigrateList = this.getVmsToMigrateFromUnderUtilizedHost(underloadedHost);
//            if (!vmsToMigrateList.isEmpty()) {
//                this.logVmsToBeReallocated(underloadedHost, vmsToMigrateList);
//                Map<Vm, Host> newVmPlacement = this.getNewVmPlacementFromUnderloadedHost(vmsToMigrateList, ignoredTargetHosts);
//                ignoredSourceHosts.addAll(this.extractHostListFromMigrationMap(newVmPlacement));
//                migrationMap.putAll(newVmPlacement);
//            }
//        }
//
//    }
//
//    private void logVmsToBeReallocated(Host underloadedHost, List<? extends Vm> migratingOutVms) {
//        if (LOGGER.isInfoEnabled()) {
//            LOGGER.info("{}: VmAllocationPolicy: VMs to be reallocated from the underloaded {}: {}", new Object[]{this.getDatacenter().getSimulation().clockStr(), underloadedHost, this.getVmIds(migratingOutVms)});
//        }
//
//    }
//
//    private Set<Host> getIgnoredHosts(Set<Host> overloadedHosts, List<Host> switchedOffHosts) {
//        HashSet<Host> ignoredHostsSet = new HashSet();
//        ignoredHostsSet.addAll(overloadedHosts);
//        ignoredHostsSet.addAll(switchedOffHosts);
//        return ignoredHostsSet;
//    }
//
//    private String getVmIds(List<? extends Vm> vmList) {
//        return (String)vmList.stream().map((vm) -> String.valueOf(vm.getId())).collect(Collectors.joining(", "));
//    }
//
//    private void printOverUtilizedHosts(Set<Host> overloadedHosts) {
//        if (!overloadedHosts.isEmpty() && LOGGER.isWarnEnabled()) {
//            String hosts = (String)overloadedHosts.stream().map(this::overloadedHostToString).collect(Collectors.joining(System.lineSeparator()));
//            LOGGER.warn("{}: VmAllocationPolicy: Overloaded hosts in {}:{}{}", new Object[]{this.getDatacenter().getSimulation().clockStr(), this.getDatacenter(), System.lineSeparator(), hosts});
//        }
//
//    }
//
//    private String overloadedHostToString(Host host) {
//        return "      Host %d (upper CPU threshold %.2f, current utilization: %.2f)".formatted(host.getId(), this.getOverUtilizationThreshold(host), host.getCpuPercentUtilization());
//    }
//
//    protected double getPowerDifferenceAfterAllocation(Host host, Vm vm) {
//        double powerAfterAllocation = this.getPowerAfterAllocation(host, vm);
//        return powerAfterAllocation > (double)0.0F ? powerAfterAllocation - host.getPowerModel().getPower() : (double)0.0F;
//    }
//
//    private boolean isNotHostOverloadedAfterAllocation(Host host, Vm vm) {
//        VmSimple tempVm = new VmSimple(vm);
//        if (!host.createTemporaryVm(tempVm).fully()) {
//            return false;
//        } else {
//            double usagePercent = this.getHostCpuPercentRequested(host);
//            boolean notOverloadedAfterAllocation = !this.isHostOverloaded(host, usagePercent);
//            host.destroyTemporaryVm(tempVm);
//            return notOverloadedAfterAllocation;
//        }
//    }
//
//    public boolean isOverloaded(Host host) {
//        return this.isHostOverloaded(host, host.getCpuPercentUtilization());
//    }
//
//    private boolean isHostOverloaded(Host host, double cpuUsagePercent) {
//        return cpuUsagePercent > this.getOverUtilizationThreshold(host);
//    }
//
//    public boolean isUnderloaded(Host host) {
//        return this.getHostCpuPercentRequested(host) < this.getUnderUtilizationThreshold();
//    }
//
//    protected Optional<Host> defaultFindHostForVm(Vm vm) {
//        return this.findHostForVm(vm, (host) -> true);
//    }
//
//    private Optional<Host> findHostForVm(Vm vm, Predicate<Host> predicate) {
//        Predicate<Host> newPredicate = predicate.and((host) -> !host.equals(vm.getHost())).and((host) -> host.isSuitableForVm(vm)).and((host) -> this.isNotHostOverloadedAfterAllocation(host, vm));
//        return this.findHostForVmInternal(vm, newPredicate);
//    }
//
//    protected Optional<Host> findHostForVmInternal(Vm vm, Predicate<Host> predicate) {
//        Comparator<Host> hostPowerConsumptionComparator = Comparator.comparingDouble((host) -> this.getPowerDifferenceAfterAllocation(host, vm));
//        return this.getHostList().stream().filter(predicate).min(hostPowerConsumptionComparator);
//    }
//
//    private List<Host> extractHostListFromMigrationMap(Map<Vm, Host> migrationMap) {
//        return new ArrayList(migrationMap.values());
//    }
//
//    private Map<Vm, Host> getMigrationMapFromOverloadedHosts(Set<Host> overloadedHosts) {
//        if (overloadedHosts.isEmpty()) {
//            return Collections.emptyMap();
//        } else {
//            this.saveAllocation();
//            Map<Vm, Host> migrationMap = new HashMap();
//
//            try {
//                List<Vm> vmsToMigrateList = this.getVmsToMigrateFromOverloadedHosts(overloadedHosts);
//                this.sortByCpuUtilization(vmsToMigrateList, this.getDatacenter().getSimulation().clock());
//                StringBuilder builder = new StringBuilder();
//                VmAllocationPolicy targetVmAllocationPolicy = this.targetMigrationDc.getVmAllocationPolicy();
//
//                for(Vm vm : vmsToMigrateList) {
//                    targetVmAllocationPolicy.findHostForVm(vm).ifPresent((targetHost) -> {
//                        this.addVmToMigrationMap(migrationMap, vm, targetHost);
//                        this.appendVmMigrationMsgToStringBuilder(builder, vm, targetHost);
//                    });
//                }
//
//                if (!migrationMap.isEmpty()) {
//                    LOGGER.info("{}: {}: Reallocation of VMs from overloaded hosts: {}{}", new Object[]{this.getDatacenter().getSimulation().clockStr(), this.getClass().getSimpleName(), System.lineSeparator(), builder});
//                }
//            } finally {
//                this.restoreAllocation();
//            }
//
//            return migrationMap;
//        }
//    }
//
//    private void appendVmMigrationMsgToStringBuilder(StringBuilder builder, Vm vm, Host targetHost) {
//        if (LOGGER.isInfoEnabled()) {
//            builder.append("      ").append(vm).append(" will be migrated from ").append(vm.getHost()).append(" to ").append(targetHost).append(System.lineSeparator());
//        }
//
//    }
//
//    private Map<Vm, Host> getNewVmPlacementFromUnderloadedHost(List<? extends Vm> vmsToMigrate, Set<? extends Host> excludedHosts) {
//        HashMap<Vm, Host> migrationMap = new HashMap();
//        this.sortByCpuUtilization(vmsToMigrate, this.getDatacenter().getSimulation().clock());
//
//        for(Vm vm : vmsToMigrate) {
//            Optional<Host> optional = this.findHostForVm(vm, (host) -> !this.isUnderloaded(host));
//            if (optional.isEmpty()) {
//                LOGGER.warn("{}: VmAllocationPolicy: A new Host, which isn't also underloaded or won't be overloaded, couldn't be found to migrate {}. Migration of VMs from the underloaded {} cancelled.", new Object[]{this.getDatacenter().getSimulation().clockStr(), vm, vm.getHost()});
//                return new HashMap();
//            }
//
//            this.addVmToMigrationMap(migrationMap, vm, (Host)optional.get());
//        }
//
//        return migrationMap;
//    }
//
//    private void sortByCpuUtilization(List<? extends Vm> vmList, double simulationTime) {
//        Comparator<Vm> comparator = Comparator.comparingDouble((vm) -> vm.getTotalCpuMipsUtilization(simulationTime));
//        vmList.sort(comparator.reversed());
//    }
//
//    private <T extends Host> void addVmToMigrationMap(Map<Vm, T> migrationMap, Vm vm, T targetHost) {
//        targetHost.createTemporaryVm(vm);
//        migrationMap.put(vm, targetHost);
//    }
//
//    private List<Vm> getVmsToMigrateFromOverloadedHosts(Set<Host> overloadedHosts) {
//        LinkedList<Vm> vmsToMigrateList = new LinkedList();
//
//        for(Host host : overloadedHosts) {
//            vmsToMigrateList.addAll(this.getVmsToMigrateFromOverloadedHost(host));
//        }
//
//        return vmsToMigrateList;
//    }
//
//    private List<Vm> getVmsToMigrateFromOverloadedHost(Host host) {
//        LinkedList<Vm> vmsToMigrateList = new LinkedList();
//
//        do {
//            Optional<Vm> optionalVm = this.getVmSelectionPolicy().getVmToMigrate(host);
//            if (optionalVm.isEmpty()) {
//                break;
//            }
//
//            Vm vm = (Vm)optionalVm.get();
//            vmsToMigrateList.add(vm);
//            host.destroyTemporaryVm(vm);
//        } while(this.isOverloaded(host));
//
//        return vmsToMigrateList;
//    }
//
//    protected List<? extends Vm> getVmsToMigrateFromUnderUtilizedHost(Host host) {
//        return host.getMigratableVms();
//    }
//
//    protected List<Host> getSwitchedOffHosts() {
//        return (List)this.getHostList().stream().filter(this::isShutdownOrFailed).collect(Collectors.toList());
//    }
//
//    private boolean isShutdownOrFailed(Host host) {
//        return !host.isActive() || host.isFailed();
//    }
//
//    private Set<Host> getOverloadedHosts() {
//        return (Set)this.getHostList().stream().filter(this::isOverloaded).filter((host) -> host.getVmsMigratingOut().isEmpty()).collect(Collectors.toSet());
//    }
//
//    private Host getUnderloadedHost(Set<? extends Host> excludedHosts) {
//        return (Host)this.getHostList().stream().filter((host) -> !excludedHosts.contains(host)).filter(Host::isActive).filter(this::isUnderloaded).filter((host) -> host.getVmsMigratingIn().isEmpty()).filter(this::notAllVmsAreMigratingOut).min(Comparator.comparingDouble(Host::getCpuPercentUtilization)).orElse(Host.NULL);
//    }
//
//    private double getHostCpuPercentRequested(Host host) {
//        return this.getHostTotalRequestedMips(host) / host.getTotalMipsCapacity();
//    }
//
//    private double getHostTotalRequestedMips(Host host) {
//        return host.getVmList().stream().mapToDouble(Vm::getTotalCpuMipsRequested).sum();
//    }
//
//    private boolean notAllVmsAreMigratingOut(Host host) {
//        return host.getVmList().stream().anyMatch((vm) -> !vm.isInMigration());
//    }
//
//    private void saveAllocation() {
//        this.savedAllocation.clear();
//
//        for(Host host : this.getHostList()) {
//            for(Vm vm : host.getVmList()) {
//                if (!host.getVmsMigratingIn().contains(vm)) {
//                    this.savedAllocation.put(vm, host);
//                }
//            }
//        }
//
//    }
//
//    private void restoreAllocation() {
//        for(Host host : this.getHostList()) {
//            host.destroyAllVms();
//            host.reallocateMigratingInVms();
//        }
//
//        for(Vm vm : this.savedAllocation.keySet()) {
//            Host host = (Host)this.savedAllocation.get(vm);
//            if (host.createTemporaryVm(vm).fully()) {
//                vm.setCreated(true);
//            } else {
//                LOGGER.error("VmAllocationPolicy: Couldn't restore {} on {}", vm, host);
//            }
//        }
//
//    }
//
//    protected double getPowerAfterAllocation(Host host, Vm vm) {
//        try {
//            return host.getPowerModel().getPower(this.getMaxUtilizationAfterAllocation(host, vm));
//        } catch (IllegalArgumentException e) {
//            LOGGER.error("Power consumption for {} could not be determined: {}", host, e.getMessage());
//            return (double)0.0F;
//        }
//    }
//
//    protected double getMaxUtilizationAfterAllocation(Host host, Vm vm) {
//        double requestedTotalMips = vm.getTotalCpuMipsRequested();
//        double hostUtilizationMips = this.getUtilizationOfCpuMips(host);
//        double hostPotentialMipsUse = hostUtilizationMips + requestedTotalMips;
//        return hostPotentialMipsUse / host.getTotalMipsCapacity();
//    }
//
//    protected double getUtilizationOfCpuMips(Host host) {
//        double hostUtilizationMips = (double)0.0F;
//
//        for(Vm vm : host.getVmList()) {
//            double additionalMips = this.additionalCpuUtilizationDuringMigration(host, vm);
//            hostUtilizationMips += additionalMips + host.getTotalAllocatedMipsForVm(vm);
//        }
//
//        return hostUtilizationMips;
//    }
//
//    private double additionalCpuUtilizationDuringMigration(Host host, Vm vm) {
//        if (!host.getVmsMigratingIn().contains(vm)) {
//            return (double)0.0F;
//        } else {
//            double maxCpuUtilization = host.getVmScheduler().getMaxCpuUsagePercentDuringOutMigration();
//            double migrationOverhead = host.getVmScheduler().getVmMigrationCpuOverhead();
//            return host.getTotalAllocatedMipsForVm(vm) * maxCpuUtilization / migrationOverhead;
//        }
//    }
//
//    public void setUnderUtilizationThreshold(double underUtilizationThreshold) {
//        if (!(underUtilizationThreshold <= (double)0.0F) && !(underUtilizationThreshold >= (double)1.0F)) {
//            this.underUtilizationThreshold = underUtilizationThreshold;
//        } else {
//            throw new IllegalArgumentException("Under utilization threshold must be greater than 0 and lower than 1.");
//        }
//    }
//
//    public final boolean isVmMigrationSupported() {
//        return true;
//    }
//
//    public final double getUnderUtilizationThreshold() {
//        return this.underUtilizationThreshold;
//    }
//
//    public final @NonNull VmSelectionPolicy getVmSelectionPolicy() {
//        return this.vmSelectionPolicy;
//    }
//
//    public final boolean isUnderloaded() {
//        return this.underloaded;
//    }
//
//    public final boolean isOverloaded() {
//        return this.overloaded;
//    }
//
//    public final MyAbstractMigrationPolicy setVmSelectionPolicy(@NonNull VmSelectionPolicy vmSelectionPolicy) {
//        if (vmSelectionPolicy == null) {
//            throw new NullPointerException("vmSelectionPolicy is marked non-null but is null");
//        } else {
//            this.vmSelectionPolicy = vmSelectionPolicy;
//            return this;
//        }
//    }
//
//    public final MyAbstractMigrationPolicy setUnderloaded(boolean underloaded) {
//        this.underloaded = underloaded;
//        return this;
//    }
//
//    public final MyAbstractMigrationPolicy setOverloaded(boolean overloaded) {
//        this.overloaded = overloaded;
//        return this;
//    }
//}
//
