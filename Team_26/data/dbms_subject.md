Database Management Systems (DBMS) provide mechanisms to store, retrieve, and manage structured data with consistency and performance guarantees.

Topics to include in-depth:
- Relational model: relations/tables, tuples, attributes, primary/foreign keys, integrity constraints.
- Schema design and normalization: functional dependencies, normal forms (1NF, 2NF, 3NF, BCNF), denormalization trade-offs.
- Query processing and optimization: parsing SQL, logical and physical query plans, cost estimation, indexing strategies (B-tree, hash indexes), query rewrite, join algorithms (nested loops, hash join, sort-merge join).
- Transaction management: ACID properties (atomicity, consistency, isolation, durability), concurrency control (locking protocols, two-phase locking), transaction isolation levels (READ UNCOMMITTED to SERIALIZABLE), optimistic concurrency.
- Recovery and durability: write-ahead logging, checkpoints, ARIES algorithm, backup and restore strategies.
- Indexing and access methods: B+-trees, hashing, multi-column indexes, covering indexes, index maintenance.
- NoSQL systems overview: document stores, key-value stores, wide-column stores, graph databases — when to use each; CAP theorem and trade-offs.
- Distributed databases and replication: replication strategies (master-slave, multi-master), consistency models, sharding and partitioning, distributed transactions, consensus protocols (Paxos, Raft).
- Storage engines and file layouts: row-store vs column-store, compression, OLTP vs OLAP workloads, columnar formats (Parquet, ORC).

Practical examples: SQL patterns for joins and aggregations, query tuning case studies, how to design a schema for high-scale applications.
